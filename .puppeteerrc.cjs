const { join } = require('path')

const config = {}

if (process.env.PUPPETEER_CACHE_DIR_LOCAL === 'true')
  config.cacheDirectory = join(__dirname, '.cache', 'puppeteer')

module.exports = config
