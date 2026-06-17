<template>
  <div id="epub-reader" class="epub-reader h-full w-full overflow-x-hidden">
    <div class="epub-reader-layout h-full flex items-center justify-center">
      <button type="button" aria-label="Previous page" class="epub-reader-nav epub-reader-nav-prev">
        <span v-if="hasPrev" class="material-symbols text-6xl" @mousedown.prevent @click="prev">chevron_left</span>
      </button>
      <div id="frame" class="epub-page-frame" :style="readerFrameStyle">
        <div id="viewer" class="epub-page-viewer h-full w-full"></div>
      </div>
      <button type="button" aria-label="Next page" class="epub-reader-nav epub-reader-nav-next">
        <span v-if="hasNext" class="material-symbols text-6xl" @mousedown.prevent @click="next">chevron_right</span>
      </button>
    </div>
  </div>
</template>

<script>
import ePub from 'epubjs'

export default {
  props: {
    libraryItem: {
      type: Object,
      default: () => {}
    },
    playerOpen: Boolean,
    keepProgress: Boolean,
    fileId: String
  },
  data() {
    return {
      windowWidth: 0,
      windowHeight: 0,
      book: null,
      rendition: null,
      chapters: [],
      ereaderSettings: {
        theme: 'dark',
        font: 'serif',
        fontScale: 100,
        lineSpacing: 115,
        spread: 'none',
        textStroke: 0
      }
    }
  },
  watch: {
    playerOpen() {
      this.resize()
    }
  },
  computed: {
    libraryItemId() {
      return this.libraryItem?.id
    },
    allowScriptedContent() {
      return this.$store.getters['libraries/getLibraryEpubsAllowScriptedContent']
    },
    hasPrev() {
      return !this.rendition?.location?.atStart
    },
    hasNext() {
      return !this.rendition?.location?.atEnd
    },
    userMediaProgress() {
      if (!this.libraryItemId) return
      return this.$store.getters['user/getUserMediaProgress'](this.libraryItemId)
    },
    savedEbookLocation() {
      if (!this.keepProgress) return null
      if (!this.userMediaProgress?.ebookLocation) return null
      if (!String(this.userMediaProgress.ebookLocation).startsWith('epubcfi')) return null
      return this.userMediaProgress.ebookLocation
    },
    localStorageLocationsKey() {
      return `ebookLocations-${this.libraryItemId}`
    },
    readerWidth() {
      if (this.windowWidth < 1000) return Math.max(this.windowWidth - 16, 280)
      return Math.max(Math.floor(this.windowWidth * 0.75), 600)
    },
    readerHeight() {
      const chromeOffset = this.windowWidth < 640 ? 76 : 100
      return Math.max(this.windowHeight - chromeOffset, 280)
    },
    readerFrameStyle() {
      return {
        height: this.readerHeight + 'px',
        width: this.readerWidth + 'px'
      }
    },
    ebookUrl() {
      if (this.fileId) {
        return `/api/items/${this.libraryItemId}/ebook/${this.fileId}`
      }
      return `/api/items/${this.libraryItemId}/ebook`
    },
    themeRules() {
      const theme = this.ereaderSettings.theme
      const isDark = theme === 'dark'
      const fontColor = isDark ? '#fff' : '#000'
      const backgroundColor = isDark ? '#000' : '#fff'
      const lineSpacing = this.ereaderSettings.lineSpacing / 100
      const fontScale = this.ereaderSettings.fontScale / 100
      const textStroke = this.ereaderSettings.textStroke / 100
      const contentPadding = this.windowWidth < 1000 ? '1.5rem' : '5rem'
      return {
        body: {
          color: `${fontColor}!important`,
          'background-color': `${backgroundColor}!important`,
          'line-height': `${lineSpacing * fontScale}rem!important`,
          '-webkit-text-stroke': `${textStroke}px ${fontColor}!important`,
          'word-wrap': 'break-word!important',
          'overflow-wrap': 'break-word!important',
          hyphens: 'auto!important',
          'padding-inline': contentPadding + '!important',
          'box-sizing': 'border-box!important',
          'text-rendering': 'optimizeLegibility!important'
        },
        img: {
          'max-width': '100%!important',
          height: 'auto!important'
        },
        svg: {
          'max-width': '100%!important',
          height: 'auto!important'
        },
        a: {
          color: `${fontColor}!important`
        }
      }
    }
  },
  methods: {
    updateSettings(settings) {
      this.ereaderSettings = settings
      if (!this.rendition) return
      this.applyTheme()
      const fontScale = settings.fontScale || 100
      this.rendition.themes.fontSize(`${fontScale}%`)
      this.rendition.themes.font(settings.font)
      this.rendition.spread('none')
      this.rendition.themes.set('hyphens', 'auto')
      this.rendition.themes.set('word-wrap', 'break-word')
      this.rendition.themes.set('overflow-wrap', 'break-word')
    },
    prev() {
      if (!this.rendition?.manager) return
      return this.rendition.prev()
    },
    next() {
      if (!this.rendition?.manager) return
      return this.rendition.next()
    },
    goToChapter(href) {
      if (!this.rendition?.manager) return
      return this.rendition.display(href)
    },
    findChapterFromPosition(chapters, position) {
      let foundChapter
      for (let i = 0; i < chapters.length; i++) {
        if (position >= chapters[i].start && (!chapters[i + 1] || position < chapters[i + 1].start)) {
          foundChapter = chapters[i]
          if (chapters[i].subitems && chapters[i].subitems.length > 0) {
            return this.findChapterFromPosition(chapters[i].subitems, position, foundChapter)
          }
          break
        }
      }
      return foundChapter
    },
    async searchBook(query) {
      const chapters = structuredClone(await this.chapters)
      const searchResults = await Promise.all(
        this.book.spine.spineItems.map((item) => item.load(this.book.load.bind(this.book)).then(item.find.bind(item, query)).finally(item.unload.bind(item)))
      )
      const mergedResults = [].concat(...searchResults)
      mergedResults.forEach((chapter) => {
        chapter.start = this.book.locations.percentageFromCfi(chapter.cfi)
        const foundChapter = this.findChapterFromPosition(chapters, chapter.start)
        if (foundChapter) foundChapter.searchResults.push(chapter)
      })
      let filteredResults = chapters.filter(function f(o) {
        if (o.searchResults.length) return true
        if (o.subitems.length) {
          return (o.subitems = o.subitems.filter(f)).length
        }
      })
      return filteredResults
    },
    keyUp(e) {
      const rtl = this.book?.package?.metadata?.direction === 'rtl'
      if ((e.keyCode || e.which) == 37) {
        return rtl ? this.next() : this.prev()
      } else if ((e.keyCode || e.which) == 39) {
        return rtl ? this.prev() : this.next()
      }
    },
    relocated(location) {
      if (this.savedEbookLocation === location.start.cfi) return
      if (location.end.percentage) {
        this.updateProgress({
          ebookLocation: location.start.cfi,
          ebookProgress: location.end.percentage
        })
      } else {
        this.updateProgress({
          ebookLocation: location.start.cfi
        })
      }
    },
    updateProgress(payload) {
      if (!this.keepProgress) return
      this.$axios.$patch(`/api/me/progress/${this.libraryItemId}`, payload, { progress: false }).catch((error) => {
        console.error('EpubReader.updateProgress failed:', error)
      })
    },
    getAllEbookLocationData() {
      const locations = []
      let totalSize = 0
      for (const key in localStorage) {
        if (!localStorage.hasOwnProperty(key) || !key.startsWith('ebookLocations-')) continue
        try {
          const ebookLocations = JSON.parse(localStorage[key])
          if (!ebookLocations.locations) throw new Error('Invalid locations object')
          ebookLocations.key = key
          ebookLocations.size = (localStorage[key].length + key.length) * 2
          locations.push(ebookLocations)
          totalSize += ebookLocations.size
        } catch (error) {
          console.error('Failed to parse ebook locations', key, error)
          localStorage.removeItem(key)
        }
      }
      locations.sort((a, b) => a.lastAccessed - b.lastAccessed)
      return { locations, totalSize }
    },
    checkSaveLocations(locationString) {
      const maxSizeInBytes = 3000000
      const newLocationsSize = JSON.stringify({ lastAccessed: Date.now(), locations: locationString }).length * 2
      if (newLocationsSize > maxSizeInBytes) {
        console.error('Epub locations are too large to store. Size =', newLocationsSize)
        return
      }
      const ebookLocationsData = this.getAllEbookLocationData()
      let availableSpace = maxSizeInBytes - ebookLocationsData.totalSize
      while (availableSpace < newLocationsSize && ebookLocationsData.locations.length) {
        const oldestLocation = ebookLocationsData.locations.shift()
        console.log(`Removing cached locations for epub "${oldestLocation.key}" taking up ${oldestLocation.size} bytes`)
        availableSpace += oldestLocation.size
        localStorage.removeItem(oldestLocation.key)
      }
      console.log(`Cacheing epub locations with key "${this.localStorageLocationsKey}" taking up ${newLocationsSize} bytes`)
      this.saveLocations(locationString)
    },
    saveLocations(locationString) {
      localStorage.setItem(this.localStorageLocationsKey, JSON.stringify({ lastAccessed: Date.now(), locations: locationString }))
    },
    loadLocations() {
      const locationsObjString = localStorage.getItem(this.localStorageLocationsKey)
      if (!locationsObjString) return null
      const locationsObject = JSON.parse(locationsObjString)
      if (!locationsObject.locations) {
        console.error('Invalid epub locations stored', this.localStorageLocationsKey)
        localStorage.removeItem(this.localStorageLocationsKey)
        return null
      }
      this.saveLocations(locationsObject.locations)
      return locationsObject.locations
    },
    flattenChapters(chapters) {
      const unwrap = (chapters) => {
        return chapters.reduce((acc, chapter) => {
          return chapter.subitems ? [...acc, chapter, ...unwrap(chapter.subitems)] : [...acc, chapter]
        }, [])
      }
      let flattenedChapters = unwrap(chapters)
      flattenedChapters = flattenedChapters.sort((a, b) => a.start - b.start)
      for (let i = 0; i < flattenedChapters.length; i++) {
        flattenedChapters[i].id = i
        if (i < flattenedChapters.length - 1) {
          flattenedChapters[i].end = flattenedChapters[i + 1].start
        } else {
          flattenedChapters[i].end = 1
        }
      }
      return flattenedChapters
    },
    initEpub() {
      const reader = this
      const customRequest = async (url) => {
        try {
          return this.$axios.$get(url, { responseType: 'arraybuffer' })
        } catch (error) {
          console.error('EpubReader.initEpub customRequest failed:', error)
          throw error
        }
      }
      reader.book = new ePub(reader.ebookUrl, {
        width: this.readerWidth,
        height: this.readerHeight,
        openAs: 'epub',
        requestMethod: customRequest
      })
      reader.rendition = reader.book.renderTo('viewer', {
        width: this.readerWidth,
        height: this.readerHeight,
        allowScriptedContent: this.allowScriptedContent,
        spread: 'none',
        snap: true,
        manager: 'continuous',
        flow: 'paginated',
        hyphens: 'auto',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        hyphenateLimitChars: { before: 2, after: 2 },
        hyphenateLimitLines: 2
      })
      reader.rendition.display(this.savedEbookLocation || reader.book.locations.start)
      reader.rendition.on('rendered', () => {
        this.applyTheme()
      })
      reader.book.ready.then(() => {
        reader.rendition.on('relocated', reader.relocated)
        reader.rendition.on('keydown', reader.keyUp)
        reader.rendition.on('touchstart', (event) => {
          this.$emit('touchstart', event)
        })
        reader.rendition.on('touchend', (event) => {
          this.$emit('touchend', event)
        })
        const savedLocations = this.loadLocations()
        if (savedLocations) {
          reader.book.locations.load(savedLocations)
        } else {
          reader.book.locations.generate().then(() => {
            this.checkSaveLocations(reader.book.locations.save())
          })
        }
        this.getChapters()
      }).catch((error) => {
        console.error('EpubReader.initEpub failed:', error)
      })
    },
    getChapters() {
      const toc = this.book?.navigation?.toc || []
      const tocTree = []
      const resolveURL = (url, relativeTo) => {
        const base = 'https://example.invalid/'
        return new URL(url, base + relativeTo).href.replace(base, '')
      }
      const basePath = this.book.packaging?.navPath || this.book.packaging?.ncxPath
      const createTree = async (toc, parent) => {
        const promises = toc.map(async (tocItem, i) => {
          const href = resolveURL(tocItem.href, basePath)
          const id = href.split('#')[1]
          const item = this.book.spine.get(href)
          if (!item) {
            parent[i] = {
              title: tocItem.label.trim(),
              subitems: [],
              href,
              cfi: '',
              start: 0,
              end: null,
              id: null,
              searchResults: []
            }
            return
          }
          await item.load(this.book.load.bind(this.book))
          const el = id ? item.document.getElementById(id) : item.document.body
          const cfi = item.cfiFromElement(el)
          parent[i] = {
            title: tocItem.label.trim(),
            subitems: [],
            href,
            cfi,
            start: this.book.locations.percentageFromCfi(cfi),
            end: null,
            id: null,
            searchResults: []
          }
          if (tocItem.subitems) {
            await createTree(tocItem.subitems, parent[i].subitems)
          }
        })
        await Promise.all(promises)
      }
      return createTree(toc, tocTree).then(() => {
        this.chapters = tocTree
      })
    },
    resize() {
      this.windowWidth = window.innerWidth
      this.windowHeight = window.innerHeight
      this.rendition?.resize(this.readerWidth, this.readerHeight)
    },
    applyTheme() {
      if (!this.rendition) return
      this.rendition.getContents().forEach((c) => {
        c.addStylesheetRules(this.themeRules)
      })
    }
  },
  mounted() {
    this.windowWidth = window.innerWidth
    this.windowHeight = window.innerHeight
    window.addEventListener('resize', this.resize)
    this.initEpub()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resize)
    this.book?.destroy()
  }
}
</script>
