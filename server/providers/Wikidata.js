const axios = require('axios').default
const Logger = require('../Logger')

class Wikidata {
  constructor() {
    this.wikidataApiUrl = 'https://www.wikidata.org/w/api.php'
    this.wikipediaApiUrl = 'https://en.wikipedia.org/w/api.php'
    this.#responseTimeout = 10000
  }

  #responseTimeout

  async wikidataRequest(params) {
    try {
      const queryString = Object.keys(params)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&')
      const response = await axios.get(`${this.wikidataApiUrl}?format=json&origin=*&${queryString}`, {
        headers: {
          'User-Agent': 'Audiobookshelf/1.0'
        },
        timeout: this.#responseTimeout
      })
      return response.data
    } catch (error) {
      Logger.error(`[Wikidata] API request failed`, error.message)
      return null
    }
  }

  async wikipediaRequest(params) {
    try {
      const queryString = Object.keys(params)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
        .join('&')
      const response = await axios.get(`${this.wikipediaApiUrl}?format=json&origin=*&${queryString}`, {
        headers: {
          'User-Agent': 'Audiobookshelf/1.0'
        },
        timeout: this.#responseTimeout
      })
      return response.data
    } catch (error) {
      Logger.error(`[Wikipedia] API request failed`, error.message)
      return null
    }
  }

  async getEntityData(entityId) {
    const data = await this.wikidataRequest({
      action: 'wbgetentities',
      ids: entityId,
      props: 'claims|descriptions|sitelinks'
    })
    return data
  }

  async findAuthorData(authorName) {
    if (!authorName) return null

    const searchResult = await this.wikidataRequest({
      action: 'wbsearchentities',
      search: authorName,
      language: 'en',
      limit: 5
    })

    if (!searchResult?.search?.length) return null

    let bestMatch = null
    for (const entity of searchResult.search) {
      const entityData = await this.getEntityData(entity.id)
      if (!entityData?.entities?.[entity.id]) continue

      const details = entityData.entities[entity.id]
      const instanceOf = details.claims?.P31
      const isHuman = instanceOf?.some((claim) => claim.mainsnak?.datavalue?.value?.id === 'Q5')

      if (isHuman || !bestMatch) {
        bestMatch = {
          id: entity.id,
          description: entity.description || details.description || null,
          entityData: details
        }
        if (isHuman) break
      }
    }

    if (!bestMatch) return null

    const result = {
      description: null,
      image: null,
      wikipediaLink: null
    }

    result.description = bestMatch.description

    const imageClaim = bestMatch.entityData.claims?.P18
    if (imageClaim?.length) {
      const imageFilename = imageClaim[0].mainsnak?.datavalue?.value
      if (imageFilename) {
        result.image = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFilename)}`
      }
    }

    const wikiSitelink = bestMatch.entityData.sitelinks?.enwiki?.title
    if (wikiSitelink) {
      result.wikipediaLink = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSitelink.replace(/ /g, '_'))}`
      const wikiData = await this.wikipediaRequest({
        action: 'query',
        prop: 'extracts',
        exintro: true,
        explaintext: true,
        titles: wikiSitelink,
        redirects: 1
      })
      if (wikiData?.query?.pages) {
        const pages = wikiData.query.pages
        const pageId = Object.keys(pages)[0]
        if (pageId && pageId !== '-1' && pages[pageId]?.extract) {
          result.description = pages[pageId].extract
        }
      }
    }

    return result
  }
}

module.exports = Wikidata
