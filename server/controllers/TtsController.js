const Path = require('path')
const fs = require('fs')
const os = require('os')
const { execFile } = require('child_process')
const Logger = require('../Logger')
const SocketAuthority = require('../SocketAuthority')
const { xmlToJSON } = require('../utils/index')
const StreamZip = require('../libs/nodeStreamZip')
const { textToSpeech } = require('../objects/tts')
const pdfParse = require('pdf-parse')
const { getFileTimestampsWithIno, filePathToPOSIX } = require('../utils/fileUtils')
const { parseDocument, DomUtils } = require('htmlparser2')
const { probe } = require('../utils/prober')
const MIN_CHAPTER_CHARS = 2000


async function getAudioDuration(audioPath) {
  try {
    const result = await probe(audioPath)
    if (result && !result.error && result.duration) {
      return result.duration
    }
    return 0
  } catch (error) {
    Logger.error(`[TtsController] Failed to probe audio duration: ${error.message}`)
    return 0
  }
}
const activeTtsGenerations = new Map()

function getTtsGenerationKey(libraryItemId) {
  return String(libraryItemId)
}

function setTtsGenerationActive(libraryItemId, isActive) {
  const key = getTtsGenerationKey(libraryItemId)
  if (isActive) activeTtsGenerations.set(key, Date.now())
  else activeTtsGenerations.delete(key)
}

function isTtsGenerationActive(libraryItemId) {
  return activeTtsGenerations.has(getTtsGenerationKey(libraryItemId))
}

function safeFilePart(value, fallback = 'chapter') {
  return String(value || fallback)
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || fallback
}

function cleanTtsText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\bTable of Contents\b/gi, '')
    .trim()
}

function stripHtml(html) {
  const htmlWithBreaks = html
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)>/gi, ' </$1> ')

  const document = parseDocument(htmlWithBreaks, { decodeEntities: true })

  const ignoredNodes = DomUtils.findAll((node) => {
    return node.name === 'script' || node.name === 'style' || node.name === 'nav'
  }, document.children)

  ignoredNodes.forEach((node) => DomUtils.removeElement(node))

  return DomUtils.textContent(document)
    .replace(/\s+/g, ' ')
    .trim()
}

function extractHtmlTitle(html) {
  const document = parseDocument(html, { decodeEntities: true })

  const heading = DomUtils.findOne((node) => {
    return ['h1', 'h2', 'h3'].includes(node.name)
  }, document.children, true)

  const headingText = heading
    ? DomUtils.textContent(heading).replace(/\s+/g, ' ').trim()
    : ''

  if (headingText) return headingText

  const titleNode = DomUtils.findOne((node) => node.name === 'title', document.children, true)
  const titleText = titleNode
    ? DomUtils.textContent(titleNode).replace(/\s+/g, ' ').trim()
    : ''

  return titleText || null
}


function normalizeChapters(chapters) {
  const cleaned = chapters
    .map((chapter, index) => ({
      ...chapter,
      index,
      title: chapter.title || `Chapter ${index + 1}`,
      text: cleanTtsText(chapter.text)
    }))
    .filter((chapter) => chapter.text)

  const normalized = []

  for (const chapter of cleaned) {
    const textLength = chapter.text.length
    const isTiny = textLength < MIN_CHAPTER_CHARS

    if (isTiny && normalized.length) {
      const previous = normalized[normalized.length - 1]
      previous.text = `${previous.text}\n\n${chapter.text}`.trim()
      previous.mergedSections = [
        ...(previous.mergedSections || []),
        {
          id: chapter.id,
          title: chapter.title,
          href: chapter.href,
          textLength
        }
      ]
      continue
    }

    normalized.push({
      ...chapter,
      mergedSections: []
    })
  }

  return normalized.map((chapter, index) => ({
    ...chapter,
    index,
    title: chapter.title || `Chapter ${index + 1}`
  }))
}


function moveFileSafeSync(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })

  try {
    fs.renameSync(src, dest)
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.copyFileSync(src, dest)
      fs.unlinkSync(src)
    } else {
      throw err
    }
  }
}

async function synthesizeTextToMp3(text, outputPath, options = {}) {
  const tempPath = await textToSpeech(text, {
    jobId: options.jobId,
    format: 'mp3',
    timeout: Number(process.env.TTS_TIMEOUT_MS || 1800000)
  })

  moveFileSafeSync(tempPath, outputPath)
  return outputPath
}

function getReadableSpineItems(packageJson) {
  const pkg = packageJson.package
  if (!pkg) return []

  const manifest = pkg.manifest?.[0]?.item || []
  const spine = pkg.spine?.[0]?.itemref || []

  const manifestMap = {}

  for (const item of manifest) {
    const attrs = item.$ || {}
    if (attrs.id) manifestMap[attrs.id] = attrs
  }

  return spine
    .map((ref, index) => {
      const idref = ref.$?.idref
      const item = manifestMap[idref]

      if (!idref || !item) return null

      const mediaType = item['media-type']
      const href = item.href

      const isHtml =
        mediaType === 'application/xhtml+xml' ||
        mediaType === 'text/html' ||
        mediaType === 'text/x-oeb1-document' ||
        mediaType?.startsWith('text/')

      if (!href || !isHtml) return null

      return {
        index,
        id: idref,
        href,
        mediaType,
        linear: ref.$?.linear !== 'no'
      }
    })
    .filter(Boolean)
    .filter((item) => item.linear)
}

function buildLibraryFileEntry({ stats, audioName, audioPath, audioRelPath }) {
  return {
    ino: stats.ino,
    metadata: {
      filename: audioName,
      ext: '.mp3',
      path: filePathToPOSIX(audioPath),
      relPath: filePathToPOSIX(audioRelPath),
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      ctimeMs: stats.ctimeMs,
      birthtimeMs: stats.birthtimeMs
    },
    isSupplementary: null,
    generatedBy: 'tts',
    addedAt: Date.now(),
    updatedAt: Date.now()
  }
}

function buildAudioFileEntry({ index, stats, duration, audioName, audioPath, audioRelPath }) {
  return {
    index,
    ino: stats.ino,
    metadata: {
      filename: audioName,
      ext: '.mp3',
      path: filePathToPOSIX(audioPath),
      relPath: filePathToPOSIX(audioRelPath),
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      ctimeMs: stats.ctimeMs,
      birthtimeMs: stats.birthtimeMs
    },
    addedAt: Date.now(),
    updatedAt: Date.now(),
    generatedBy: 'tts',
    duration,
    format: 'mp3',
    codec: 'mp3',
    bitRate: Math.round(duration > 0 ? stats.size * 8 / duration : 0),
    timeBase: null,
    channels: 1,
    channelLayout: 'mono',
    language: 'eng',
    trackNumFromMeta: index,
    discNumFromMeta: null,
    trackNumFromFilename: index,
    discNumFromFilename: null,
    manuallyVerified: false,
    exclude: false,
    error: null,
    chapters: [],
    metaTags: {},
    mimeType: 'audio/mpeg',
    embeddedCoverArt: null
  }
}

async function extractXmlToJson(epubPath, xmlFilepath) {
  const filedata = await extractFileFromEpub(epubPath, xmlFilepath)
  if (!filedata) return null
  return xmlToJSON(filedata)
}
async function extractFileFromEpub(epubPath, filepath) {
  const zip = new StreamZip.async({ file: epubPath })

  try {
    const data = await zip.entryData(filepath)
    return data?.toString('utf8') || null
  } catch (error) {
    Logger.error(`[TtsController] Failed to extract ${filepath} from epub: ${error.message}`)
    return null
  } finally {
    await zip.close().catch(() => {})
  }
}
class TtsController {

  async extractEpubChapterTexts(ebookFile) {
    const epubPath = ebookFile.metadata.path

    const containerJson = await extractXmlToJson(epubPath, 'META-INF/container.xml')
    if (!containerJson) return null

    const packageDocPath = containerJson.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.['full-path']
    if (!packageDocPath) return null

    const packageJson = await extractXmlToJson(epubPath, packageDocPath)
    if (!packageJson) return null

    const packageDir = Path.posix.dirname(packageDocPath)
    const spineItems = getReadableSpineItems(packageJson)
    const chapters = []

    for (const spineItem of spineItems) {
      const chapterPath = Path.posix.normalize(
        packageDir === '.'
          ? spineItem.href
          : Path.posix.join(packageDir, spineItem.href)
      )

      const html = await extractFileFromEpub(epubPath, chapterPath)
      if (!html) continue

      const text = cleanTtsText(stripHtml(html))
      if (!text) continue

      chapters.push({
        index: chapters.length,
        id: spineItem.id,
        href: spineItem.href,
        path: chapterPath,
        title: extractHtmlTitle(html) || `Section ${chapters.length + 1}`,
        text
      })
    }

    return normalizeChapters(chapters)
  }
  async extractPdfChapterTexts(ebookFile) {
    const pdfPath = ebookFile.metadata.path
    const dataBuffer = fs.readFileSync(pdfPath)
    const data = await pdfParse(dataBuffer)

    return normalizeChapters([{
      index: 0,
      id: 'pdf-0',
      href: null,
      path: pdfPath,
      title: 'PDF',
      text: cleanTtsText(data.text)
    }])
  }

  async extractBookChapters(ebookFile) {
    const isPdf = ebookFile.ebookFormat === 'pdf'
    const chapters = isPdf
      ? await this.extractPdfChapterTexts(ebookFile)
      : await this.extractEpubChapterTexts(ebookFile)

    if (!chapters || !chapters.length) return null
    return chapters
  }

  async getChapters(req, res) {
    const libraryItem = req.libraryItem

    if (libraryItem.hasSourceAudioTracks()) {
      return res.status(400).send('TTS is only available for books without audio tracks')
    }

    const ebookFile = libraryItem?.media?.ebookFile
    if (!ebookFile) {
      return res.status(404).send('No ebook file found')
    }

    try {
      const chapters = await this.extractBookChapters(ebookFile)

      if (!chapters) {
        return res.status(500).send('Failed to extract chapter text')
      }

      return res.json({
        chapters: chapters.map((chapter) => ({
          index: chapter.index,
          id: chapter.id,
          href: chapter.href,
          path: chapter.path,
          title: chapter.title,
          textLength: chapter.text.length,
          estimatedChunks: null,
          mergedSections: chapter.mergedSections || []
        }))
      })
    } catch (error) {
      Logger.error(`[TtsController] Failed to get chapters: ${error.message}`)
      return res.status(500).send(error.message)
    }
  }

  async synthesize(req, res) {
    const text = req.body?.text

    if (!text || !text.trim()) {
      return res.status(400).send('Text is required')
    }

    const outputPath = Path.join(
      os.tmpdir(),
      `tts-response-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`
    )

    try {
      await synthesizeTextToMp3(text.trim(), outputPath, {
        jobId: `preview-${Date.now()}`
      })

      res.setHeader('Content-Type', 'audio/mpeg')
      return res.sendFile(outputPath, () => {
        fs.unlink(outputPath, () => {})
      })
    } catch (error) {
      fs.unlink(outputPath, () => {})
      Logger.error(`[TtsController] TTS error: ${error.message}`)
      return res.status(500).send(error.message)
    }
  }

  async synthesizeChapter(req, res) {
    const libraryItem = req.libraryItem

    if (libraryItem.hasSourceAudioTracks()) {
      return res.status(400).send('TTS is only available for books without audio tracks')
    }

    const ebookFile = libraryItem?.media?.ebookFile
    if (!ebookFile) {
      return res.status(404).send('No ebook file found')
    }

    try {
      const chapters = await this.extractBookChapters(ebookFile)

      if (!chapters) {
        return res.status(500).send('Failed to extract chapter text')
      }

      const chapterIndex = Number(req.body?.chapterIndex ?? 0)

      if (!Number.isInteger(chapterIndex) || chapterIndex < 0) {
        return res.status(400).send('Invalid chapterIndex')
      }

      const chapter = chapters[chapterIndex]

      if (!chapter) {
        return res.status(404).send('Chapter not found')
      }

      req.body.text = chapter.text
      return this.synthesize(req, res)
    } catch (error) {
      Logger.error(`[TtsController] Chapter TTS error: ${error.message}`)
      return res.status(500).send(error.message)
    }
  }

  getGenerationStatus(req, res) {
    return res.json({
      libraryItemId: req.libraryItem.id,
      isGenerating: isTtsGenerationActive(req.libraryItem.id)
    })
  }

  async generateTtsAudioFiles(req, res) {
    const libraryItem = req.libraryItem

    if (libraryItem.hasSourceAudioTracks()) {
      return res.status(400).send('TTS is only available for books without audio tracks')
    }

    const ebookFile = libraryItem?.media?.ebookFile
    if (!ebookFile) {
      return res.status(404).send('No ebook file found')
    }

    setTtsGenerationActive(libraryItem.id, true)

    try {
      const chapters = await this.extractBookChapters(ebookFile)

      if (!chapters || !chapters.length) {
        return res.status(500).send('Failed to extract chapter text')
      }

      const ttsDir = Path.join(libraryItem.path, 'tts')
      fs.mkdirSync(ttsDir, { recursive: true })

      const generatedLibraryFiles = []
      const generatedAudioFiles = []

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i]
        const trackIndex = i + 1
        const chapterTitle = chapter.title || `Chapter ${trackIndex}`

        const audioName = `${String(trackIndex).padStart(3, '0')}-${safeFilePart(chapterTitle, `chapter-${trackIndex}`)}.mp3`
        const audioRelPath = `tts/${audioName}`
        const audioPath = Path.join(ttsDir, audioName)

        Logger.info(`[TtsController] Generating speech for chapter ${trackIndex}/${chapters.length}: ${chapterTitle}`)

        SocketAuthority.emitter('tts_generation_progress', {
          libraryItemId: libraryItem.id,
          chapterIndex: i,
          chapterTitle,
          chapterProgress: 0,
          totalChapters: chapters.length,
          status: 'started'
        })

        await synthesizeTextToMp3(chapter.text, audioPath, {
          jobId: `${libraryItem.id}-${i}`
        })

        SocketAuthority.emitter('tts_generation_progress', {
          libraryItemId: libraryItem.id,
          chapterIndex: i,
          chapterTitle,
          chapterProgress: 100,
          totalChapters: chapters.length,
          status: 'completed'
        })

        const stats = await getFileTimestampsWithIno(audioPath)
        const duration = await getAudioDuration(audioPath)

        generatedLibraryFiles.push(buildLibraryFileEntry({
          stats,
          audioName,
          audioPath,
          audioRelPath
        }))

        generatedAudioFiles.push(buildAudioFileEntry({
          index: trackIndex,
          stats,
          duration,
          audioName,
          audioPath,
          audioRelPath
        }))
      }

      const existingTtsFilePaths = (libraryItem.libraryFiles || [])
        .filter((libraryFile) => libraryFile.metadata?.relPath?.startsWith('tts/'))
        .map((libraryFile) => libraryFile.metadata?.path)
        .filter(Boolean)

      libraryItem.libraryFiles = (libraryItem.libraryFiles || [])
        .filter((libraryFile) => !libraryFile.metadata?.relPath?.startsWith('tts/'))

      libraryItem.media.audioFiles = (libraryItem.media.audioFiles || [])
        .filter((audioFile) => !audioFile.metadata?.relPath?.startsWith('tts/'))

      for (const filePath of existingTtsFilePaths) {
        fs.unlink(filePath, () => {})
      }

      libraryItem.libraryFiles.push(...generatedLibraryFiles)
      libraryItem.media.audioFiles.push(...generatedAudioFiles)

      libraryItem.changed('libraryFiles', true)
      libraryItem.media.changed('audioFiles', true)

      libraryItem.media.duration = generatedAudioFiles.reduce((sum, audioFile) => {
        return sum + (Number(audioFile.duration) || 0)
      }, 0)

      libraryItem.size = libraryItem.libraryFiles.reduce((sum, libraryFile) => {
        return sum + (Number(libraryFile.metadata?.size) || 0)
      }, 0)

      await libraryItem.media.save()
      await libraryItem.save()

      SocketAuthority.libraryItemEmitter('item_updated', libraryItem)

      return res.json({
        success: true,
        audioFilesGenerated: generatedAudioFiles.length,
        totalDuration: libraryItem.media.duration,
        item: libraryItem.toOldJSON()
      })
    } catch (error) {
      Logger.error(`[TtsController] TTS generation error: ${error.message}`)
      return res.status(500).send(error.message)
    } finally {
      setTtsGenerationActive(libraryItem.id, false)
    }
  }
}

module.exports = new TtsController()
