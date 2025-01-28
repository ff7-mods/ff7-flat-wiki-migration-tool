const cheerio = require('cheerio')
const got = require('got')
const fs = require('fs-extra')
const path = require('path')
const stream = require('stream')
const { promisify } = require('util')
const pipeline = promisify(stream.pipeline)

const DOMAIN = 'https://wiki.ffrtt.ru'
const SCRAPE_URL_PAGES = `${DOMAIN}/index.php?title=Special:AllPages&hideredirects=1`
const EXPORT_URL_PAGES = `${DOMAIN}/index.php?title=Special:Export/`
const EXPORT_URL_ASSETS = `${DOMAIN}/index.php?title=Special:ListFiles`
const EXPORT_REDIRECTS = `${DOMAIN}/index.php?title=Special:ListRedirects&limit=500&offset=0`

const OUTPUT_DIR_PAGES = './output/mediawiki/pages'
const OUTPUT_DIR_ASSETS = './output/mediawiki/assets'
const OUTPUT_REDIRECTS = './output/mediawiki/redirects.json'

const scrapePage = async (url, list) => {
  console.log('scrapePage', url)
  const response = await got(url)
  let nextUrl = false
  const $ = cheerio.load(response.body)
  $('.mw-allpages-body a').each((i, link) => {
    const title = link.attribs.href.replace('/index.php/', '')
    list.push(title)
  })
  $('.mw-allpages-nav a:contains("Next page")').first().each((i, link) => {
    nextUrl = DOMAIN + link.attribs.href
  })
  return nextUrl
}
const getAllPageNames = async () => {
  let nextUrl = SCRAPE_URL_PAGES
  const nameList = []
  do {
    nextUrl = await scrapePage(nextUrl, nameList)
  } while (nextUrl)
  console.log('getAllPageNames', nameList)
  return nameList
}
const downloadPages = async (allPageNames) => {
  await fs.remove(OUTPUT_DIR_PAGES)
  for (let i = 0; i < allPageNames.length; i++) {
    //   for (let i = 0; i < 7; i++) {
    const pageName = allPageNames[i]
    const url = EXPORT_URL_PAGES + pageName
    console.log('Download Pages', (i + 1), 'of', allPageNames.length, '-', url)
    const response = await got(url)
    const $ = cheerio.load(response.body, {xmlMode: true})
    const title = pageName
    const body = $('mediawiki page revision text').text()
    const file = path.join(OUTPUT_DIR_PAGES, `${title}.mw`)
    const dir = path.dirname(file)
    await fs.ensureDir(dir)
    await fs.writeFile(file, body)
  }
}
const downloadFiles = async () => {
  await fs.remove(OUTPUT_DIR_ASSETS)

  const response = await got(EXPORT_URL_ASSETS)
  const $ = cheerio.load(response.body) // Note: No pagination needed, only one page
  console.log($('title').text())

  $('.TablePager_col_img_name').each(async (i, cellEle) => {
    const links = $(cellEle).find('a').toArray()
    const fileName = links[0].attribs.href.replace('/index.php?title=', '').replace('File:', '')
    const file = path.join(OUTPUT_DIR_ASSETS, fileName)
    const dir = path.dirname(file)
    await fs.ensureDir(dir)
    const url = DOMAIN + links[1].attribs.href
    console.log('file', fileName, url)

    await pipeline(got.stream(url), fs.createWriteStream(file))
    console.log(`File downloaded to ${fileName}`)
  })
}
const downloadRedirects = async () => {
  console.log('downloadRedirects', EXPORT_REDIRECTS)
  const response = await got(EXPORT_REDIRECTS)
  const $ = cheerio.load(response.body)
  const redirects = []
  $('ol.special li').each((i, li) => {
    const links = $(li).find('a').toArray().map(l => l.attribs.href)
    const from = links[0].replace('/index.php?title=', '').replace('&redirect=no', '')
    const to = links[1].replace('/index.php?title=', '')
    console.log('links', from, '->', to)
    redirects.push({from, to})
  })
  // console.log('redirects', redirects)
  await fs.writeJson(OUTPUT_REDIRECTS, redirects)
  // $('.mw-allpages-nav a:contains("Next page")').first().each((i, link) => {
  //   nextUrl = DOMAIN + link.attribs.href
  // })
  // return nextUrl
}
const initDownloadFiles = async () => {
  console.log('Downloading wiki data: START')
  try {
    const allPageNames = await getAllPageNames()
    await downloadPages(allPageNames)
    await downloadFiles()
    await downloadRedirects()
    console.log('Downloading wiki data: START')
  } catch (error) {
    console.error(`Downloading wiki data: ERROR - ${error.message}`)
  }
}

module.exports = {
  initDownloadFiles
}
