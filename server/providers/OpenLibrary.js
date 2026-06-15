const axios = require('axios').default
const Logger = require('../Logger')
const { levenshteinDistance } = require('../utils/index')
const Wikidata = require('./Wikidata')

/**
 * @typedef AuthorSearchObj
 * @property {string} asin
 * @property {string} description
 * @property {string} image
 * @property {string} name
 * @property {string} wikipediaLink
 */

class OpenLibrary {
  #responseTimeout = 10000

  constructor() {
    this.baseUrl = 'https://openlibrary.org'
    this.wikidata = new Wikidata()
  }

  /**
   *
   * @param {string} uri
   * @param {number} timeout
   * @returns {Promise<Object>}
   */
  get(uri, timeout = this.#responseTimeout) {
    if (!timeout || isNaN(timeout)) timeout = this.#responseTimeout
    const normalizedUri = uri.startsWith('/') ? uri.slice(1) : uri
    return axios
      .get(`${this.baseUrl}/${normalizedUri}`, {
        timeout
      })
      .then((res) => {
        return res.data
      })
      .catch((error) => {
        Logger.error(`[OpenLibrary] Request failed for "${uri}"`, error.message)
        return null
      })
  }

  parseDescription(authorData) {
    if (!authorData?.bio) return null
    if (typeof authorData.bio === 'string') return authorData.bio
    return authorData.bio.value || null
  }

  getAuthorImage(authorData, authorKey) {
    const photoId = authorData?.photos?.find((photo) => photo > 0)
    if (photoId) return `https://covers.openlibrary.org/a/id/${photoId}-L.jpg`
    return null
  }

  /**
   *
   * @param {string} authorKey
   * @returns {Promise<AuthorSearchObj>}
   */
  async authorRequest(authorKey) {
    if (!authorKey) return null

    const normalizedKey = authorKey.startsWith('/authors/') ? authorKey : `/authors/${authorKey}`
    const authorData = await this.get(`${normalizedKey}.json`)
    if (!authorData?.name) return null

    const olid = normalizedKey.split('/').pop()
    const result = {
      asin: null,
      description: this.parseDescription(authorData),
      image: this.getAuthorImage(authorData, olid),
      name: authorData.name,
      wikipediaLink: null
    }

    // Fallback to Wikidata/Wikipedia for missing description or image
    if (!result.description || !result.image || !result.wikipediaLink) {
      const wikiData = await this.wikidata.findAuthorData(authorData.name)
      if (wikiData) {
        if (!result.description && wikiData.description) {
          result.description = wikiData.description
        }
        if (!result.image && wikiData.image) {
          result.image = wikiData.image
        }
        if (!result.wikipediaLink && wikiData.wikipediaLink) {
          result.wikipediaLink = wikiData.wikipediaLink
        }
      }
    }

    return result
  }

  /**
   *
   * @param {string} name
   * @param {number} maxLevenshtein
   * @returns {Promise<AuthorSearchObj>}
   */
  async findAuthorByName(name, maxLevenshtein = 3) {
    if (!name) return null

    const query = encodeURIComponent(name)
    const searchData = await this.get(`/search/authors.json?q=${query}`)
    const docs = searchData?.docs || []

    let closestMatch = null
    docs.forEach((authorDoc) => {
      if (!authorDoc?.name || !authorDoc?.key) return
      authorDoc.levenshteinDistance = levenshteinDistance(authorDoc.name, name)
      if (!closestMatch || closestMatch.levenshteinDistance > authorDoc.levenshteinDistance) {
        closestMatch = authorDoc
      }
    })

    if (!closestMatch || closestMatch.levenshteinDistance > maxLevenshtein) {
      return null
    }

    return this.authorRequest(closestMatch.key)
  }

  /**
   *
   * @param {string} asin
   * @param {string} region
   * @returns {Promise<AuthorSearchObj>}
   */
  async findAuthorByASIN(asin, region = 'us') {
    if (!asin) return null

    // Open Library does not have a direct ASIN lookup, but ASINs for books
    // are often the same as the ISBN-10. Try an ISBN lookup.
    const bookData = await this.isbnLookup(asin)
    if (!bookData || bookData.errorCode) {
      // Try alternate method: search by ISBN as a standard book number
      const searchResult = await this.search({ isbn: asin })
      if (!searchResult || searchResult.errorCode || !searchResult.length) return null
      const firstResult = searchResult[0]
      if (firstResult.authors && firstResult.authors.length) {
        // author key is in format /authors/OL... in the works response
        const worksAuthor = firstResult.authors.find((a) => a.key)
        if (worksAuthor) return this.authorRequest(worksAuthor.key)
      }
      return null
    }

    // Try to get author from book/edition data directly
    if (bookData.authors && bookData.authors.length > 0) {
      const authorKey = bookData.authors[0].key
      if (authorKey) return this.authorRequest(authorKey)
    }

    // Try to get author from works data
    if (bookData.works && bookData.works.length > 0) {
      const worksData = await this.get(`${bookData.works[0].key}.json`)
      if (worksData?.authors && worksData.authors.length > 0) {
        const authorKey = worksData.authors[0].author?.key
        if (authorKey) return this.authorRequest(authorKey)
      }
    }

    return null
  }

  async isbnLookup(isbn) {
    var lookupData = await this.get(`/isbn/${isbn}`)
    if (!lookupData) {
      return {
        errorCode: 404
      }
    }
    return lookupData
  }

  async getWorksData(worksKey) {
    var worksData = await this.get(`${worksKey}.json`)
    if (!worksData) {
      return {
        errorMsg: 'Works Data Request failed',
        errorCode: 500
      }
    }
    if (!worksData.covers) worksData.covers = []
    var coverImages = worksData.covers.filter((c) => c > 0).map((c) => `https://covers.openlibrary.org/b/id/${c}-L.jpg`)
    var description = null
    if (worksData.description) {
      if (typeof worksData.description === 'string') {
        description = worksData.description
      } else {
        description = worksData.description.value || null
      }
    }
    return {
      id: worksKey.split('/').pop(),
      key: worksKey,
      covers: coverImages,
      first_publish_date: worksData.first_publish_date,
      description: description
    }
  }

  parsePublishYear(doc, worksData) {
    if (doc.first_publish_year && !isNaN(doc.first_publish_year)) return String(doc.first_publish_year)
    if (worksData.first_publish_date) {
      var year = worksData.first_publish_date.split('-')[0]
      if (!isNaN(year)) return String(year)
    }
    return null
  }

  async cleanSearchDoc(doc) {
    var worksData = await this.getWorksData(doc.key)
    return {
      title: doc.title,
      author: doc.author_name ? doc.author_name.join(', ') : null,
      publishedYear: this.parsePublishYear(doc, worksData),
      edition: doc.cover_edition_key,
      cover: doc.cover_edition_key ? `https://covers.openlibrary.org/b/OLID/${doc.cover_edition_key}-L.jpg` : null,
      ...worksData
    }
  }

  async search(query) {
    var queryString = Object.keys(query)
      .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(query[key]))
      .join('&')
    var lookupData = await this.get(`/search.json?${queryString}`)
    if (!lookupData) {
      return {
        errorCode: 404
      }
    }
    var searchDocs = await Promise.all(lookupData.docs.map((d) => this.cleanSearchDoc(d)))
    return searchDocs
  }

  /**
   *
   * @param {string} title
   * @param {number} timeout
   * @returns {Promise<Object[]>}
   */
  async searchTitle(title, timeout = this.#responseTimeout) {
    title = encodeURIComponent(title)
    var lookupData = await this.get(`/search.json?title=${title}`, timeout)
    if (!lookupData) {
      return {
        errorCode: 404
      }
    }
    var searchDocs = await Promise.all(lookupData.docs.map((d) => this.cleanSearchDoc(d)))
    return searchDocs
  }
}
module.exports = OpenLibrary
