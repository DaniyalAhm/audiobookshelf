const fs = require('fs')
const os = require('os')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')
const { execFile } = require('child_process')

const DEFAULT_TTS_ENDPOINT = process.env.TTS_ENDPOINT || 'http://tts_server:5005/tts'
const DEFAULT_REF_AUDIO = process.env.TTS_REF_AUDIO || './ref.wav'
const DEFAULT_REF_TEXT = process.env.TTS_REF_TEXT || 'Transcription of the reference audio.'
const DEFAULT_FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg'

function convertWavToMp3(wavPath, mp3Path) {
  return new Promise((resolve, reject) => {
    execFile(
      DEFAULT_FFMPEG_BIN,
      ['-y', '-i', wavPath, '-codec:a', 'libmp3lame', '-qscale:a', '2', mp3Path],
      (error) => {
        if (error) reject(error)
        else resolve(mp3Path)
      }
    )
  })
}

async function textToSpeech(text, options = {}) {
  if (!text || !text.trim()) {
    throw new Error('Text is required')
  }

  const endpoint = options.endpoint || DEFAULT_TTS_ENDPOINT

  const tempName = `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const mp3Path = path.join(os.tmpdir(), `${tempName}.mp3`)

  const refAudioPath = options.refAudio || options.ref_audio
  const refText = options.refText || options.ref_text

  let response

  if (!refAudioPath) {
    // Default Flask voice: send simple JSON, not multipart.
    response = await axios.post(endpoint, {
      text: text.trim(),
      format: 'mp3'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      timeout: options.timeout || Number(process.env.TTS_TIMEOUT_MS || 1800000),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true
    })
  } else {
    // Custom reference voice: use multipart.
    if (!fs.existsSync(refAudioPath)) {
      throw new Error(`Reference audio not found: ${refAudioPath}`)
    }

    if (!refText || !refText.trim()) {
      throw new Error('refText is required when using custom refAudio')
    }

    const form = new FormData()
    form.append('text', text.trim())
    form.append('format', 'mp3')
    form.append('ref_audio', fs.createReadStream(refAudioPath))
    form.append('ref_text', refText.trim())

    const headers = form.getHeaders()

    // Important for Gunicorn: avoid broken chunked multipart uploads.
    const contentLength = await new Promise((resolve, reject) => {
      form.getLength((err, length) => {
        if (err) reject(err)
        else resolve(length)
      })
    })

    headers['Content-Length'] = contentLength

    response = await axios.post(endpoint, form, {
      headers,
      responseType: 'arraybuffer',
      timeout: options.timeout || Number(process.env.TTS_TIMEOUT_MS || 1800000),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true
    })
  }

  const contentType = response.headers['content-type'] || ''
  const responseBuffer = Buffer.from(response.data || [])

  if (response.status < 200 || response.status >= 300) {
    const body = responseBuffer.toString('utf8')
    throw new Error(`TTS API failed with ${response.status}: ${body}`)
  }

  if (!contentType.includes('audio')) {
    const body = responseBuffer.toString('utf8')
    throw new Error(`TTS API returned non-audio response: ${contentType} ${body}`)
  }

  if (!responseBuffer.length) {
    throw new Error('TTS API returned empty audio response')
  }

  fs.writeFileSync(mp3Path, responseBuffer)

  if (!fs.existsSync(mp3Path) || fs.statSync(mp3Path).size === 0) {
    throw new Error('TTS API did not create a valid MP3 file')
  }

  return mp3Path
}

module.exports = {
  textToSpeech,
  generateMp3WithOllama: textToSpeech
}
