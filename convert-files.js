const pandoc = require('node-pandoc-promise')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob-promise')

const MEDIAWIKI_DIR_PAGES = './output/mediawiki/pages'
const MEDIAWIKI_DIR_ASSETS = './output/mediawiki/assets'
const MEDIAWIKI_REDIRECTS = './output/mediawiki/redirects.json'

const OUTPUT_ROOT_FOLDER = 'ff7-flat-wiki'
const PANDOC_DIR_PAGES = './output/pandoc/pages'
const OUTPUT_DIR_PAGES = `./output/markdown/${OUTPUT_ROOT_FOLDER}`
const OUTPUT_DIR_ASSETS = `./output/markdown/${OUTPUT_ROOT_FOLDER}/assets`

const getMediaWikiPageNames = async () => {
  const mediaWikiPageNames = await glob(`**/*.mw`, {cwd: MEDIAWIKI_DIR_PAGES})
  console.log('mediaWikiPageNames', mediaWikiPageNames)
  return mediaWikiPageNames
}
const convertToMarkdown = async () => {
  const mediaWikiPageNames = await getMediaWikiPageNames()
  await fs.remove(PANDOC_DIR_PAGES)
  const convertedPageNames = []
  for (let i = 0; i < mediaWikiPageNames.length; i++) {
    //   for (let i = 0; i < 5; i++) {
    const mediaWikiPageName = mediaWikiPageNames[i]
    const markdownPageName = mediaWikiPageName.replace('.mw', '.md')
    console.log('Converting', (i + 1), 'of', mediaWikiPageNames.length, ' - ', mediaWikiPageName)
    const mediaWikiFile = path.join(MEDIAWIKI_DIR_PAGES, mediaWikiPageName)
    const markdownFile = path.join(PANDOC_DIR_PAGES, markdownPageName)
    const markdownDir = path.dirname(markdownFile)
    // console.log('markdownFile', mediaWikiFile, '->', markdownFile, 'in', markdownDir)
    await fs.ensureDir(markdownDir)
    await pandoc(mediaWikiFile, ['-f', 'mediawiki', '-t', 'gfm', '-o', markdownFile, '--wrap=none'])
    convertedPageNames.push(markdownPageName)
  }
  return convertedPageNames
}

const getMarkdownPageNames = async () => {
  const markdownPageNames = await glob(`**/*.md`, {cwd: PANDOC_DIR_PAGES})
  //   console.log('markdownPageNames', markdownPageNames)
  return markdownPageNames
}
const isImage = (fileName) => {
  if (fileName.includes('.')) {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.') + 1)
    switch (ext) {
      case 'png': case 'jpeg': case 'jpg':
        return true
    }
  }
  return false
}
const applyRedirect = (link, redirects) => {
  const potentialRedirects = redirects.filter(r => r.from === link)
  if (potentialRedirects.length > 0 && link.toLowerCase().includes('engine')) {
    console.log('redirect', link, potentialRedirects[0])
    link = potentialRedirects[0].to
  }
  return link
}
const cleanLink = (link, currentPage, redirects) => {
  if (link.startsWith('#')) {
    link = `#${link.toLowerCase().replace(/[ _]/g, '-').replace('#', '')}`
  } else if (!link.startsWith('http')) {
    link = applyRedirect(link, redirects)
    if (isImage(link)) {
      link = `assets/${link}`
      console.log('isImage', link)
    } else {
      link = `${link}`
      if (link.includes('#')) {
        const hashIndex = link.indexOf('#')
        const hash = link.substring(hashIndex)
        link = `${link.substring(0, hashIndex)}${hash}`
      } else {
        link = link
      }
    }
    let relativeLink = path.relative(currentPage, link)
    relativeLink = relativeLink.substring(3)
    // console.log('link', currentPage, link, relativeLink)
    link = relativeLink
  }
  return link
}
const amendHTMLLink = (page, markdownPageName, redirects) => {
  const regex = /href="([^"]*)"/g
  let match
  let replacements = []
  while ((match = regex.exec(page)) !== null) {
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
    const wholeLink = match[0]
    const href = match[1]
    const link = cleanLink(href, markdownPageName, redirects)
    // console.log('amendHTMLLink', wholeLink, href, link)
    replacements.push({replace: wholeLink, with: `href="${link}"`})
  }
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements
    page = page.replace(replacement[i].replace, replacement[i].with)
  }
  return page
}
const amendLink = (page, markdownPageName, redirects) => {
  page = page.replace(/\[ /g, '[') // Some whitespace at the beginning of some links
  page = page.replace(/<center>/g, '').replace(/<\/center>/g, '') // Lots of markdown links are wrapped in center blocks
  const regex = /(\[.*\])\((.+)\)/g
  let match
  let replacements = []
  while ((match = regex.exec(page)) !== null) {
    if (match.index === regex.lastIndex) {
      regex.lastIndex++
    }
    const wholeLink = match[0]
    const linkTitle = match[1]
    const initialLinkAndTitle = match[2]
    let updatedLinkAndTitle = initialLinkAndTitle
    let title = ''
    if (updatedLinkAndTitle.includes('"')) {
      const t1 = updatedLinkAndTitle.indexOf('"')
      const t2 = updatedLinkAndTitle.lastIndexOf('"')
      title = updatedLinkAndTitle.substring(t1, t2 + 1)
      updatedLinkAndTitle = updatedLinkAndTitle.substring(0, t1 - 1)
    //   console.log('t1', t1, t2, title, '-' + updatedLinkAndTitle + '-')
    }
    updatedLinkAndTitle = cleanLink(updatedLinkAndTitle, markdownPageName, redirects)

    if (title.length > 0) {
      updatedLinkAndTitle = `${updatedLinkAndTitle}`
    }

    const updatedWholeLink = `${linkTitle}(${updatedLinkAndTitle})`
    // console.log('match', wholeLink, '-', initialLinkAndTitle, '->', updatedWholeLink)
    replacements.push({replace: wholeLink, with: updatedWholeLink})
  }
  for (let i = 0; i < replacements.length; i++) {
    const replacement = replacements
    page = page.replace(replacement[i].replace, replacement[i].with)
    page = page.replace(replacement[i].replace, replacement[i].with)
  }

  //   console.log('page', page)
  return page
}
const amendAssetLink = (page, markdownPageName) => {
  page = page.replace(
    /<figure>\s*<img src="([^"]+)" title="([^"]+)"\s*\/?>\s*<figcaption>[^<]+<\/figcaption>\s*<\/figure>/g,
    (_, src, title) => `![${title}]({{site.baseurl}}/assets/${src})`
  )
return page
}
const addBreadcrumb = (page, markdownPageName, redirects) => {
  const breadcrumbs = [{ title: 'Home', link: cleanLink(`Main_Page`, markdownPageName, redirects) }]
  const prevSection = []
  const sections = markdownPageName.replace('.md', '').split('/')
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    prevSection.push(section)
    breadcrumbs.push({ title: section.replace(/_/g, ' '), link: cleanLink(prevSection.join('/'), markdownPageName, redirects) })
  }
  const breadcrumbsMarkdown = breadcrumbs.map((b, i) => {
    if (i === breadcrumbs.length - 1) {
      return b.title
    }
    return `[${b.title}](${b.link})`
  }).join(' > ')
  //   console.log('addBreadcrumb', markdownPageName, sections, breadcrumbs, breadcrumbsMarkdown)

  page = `${breadcrumbsMarkdown}\n\n${page}`
  return page
}
const addFrontMatter = (page, markdownPageName) => {
  const title = markdownPageName.substring(markdownPageName.lastIndexOf('/') + 1, markdownPageName.lastIndexOf('.'))
  page = `---\ntitle: ${title}\n---\n\n${page}`
  return page
}
const amendLinks = async () => {
  await fs.remove(OUTPUT_DIR_PAGES)
  const markdownPageNames = await getMarkdownPageNames()
  const redirects = await fs.readJson(MEDIAWIKI_REDIRECTS)
  for (let i = 0; i < markdownPageNames.length; i++) {
    const markdownPageName = markdownPageNames[i]
    // console.log('Amending links', (i + 1), 'of', markdownPageNames.length, ' - ', markdownPageName)
    const pandocFile = path.join(PANDOC_DIR_PAGES, markdownPageName)
    const markdownFile = path.join(OUTPUT_DIR_PAGES, markdownPageName)
    let page = await fs.readFile(pandocFile, 'utf8')
    page = amendLink(page, markdownPageName, redirects)
    page = amendHTMLLink(page, markdownPageName, redirects)
    // page = addBreadcrumb(page, markdownPageName, redirects)
    page = addFrontMatter(page, markdownPageName)
    page = amendAssetLink(page, markdownPageName)

    const markdownDir = path.dirname(markdownFile)
    await fs.ensureDir(markdownDir)
    await fs.writeFile(markdownFile, page)
  }
}
const moveAssets = async () => {
  await fs.remove(OUTPUT_DIR_ASSETS)
  await fs.ensureDir(OUTPUT_DIR_ASSETS)
  await fs.copy(MEDIAWIKI_DIR_ASSETS, OUTPUT_DIR_ASSETS)
}
const initConvertFiles = async () => {
  try {
    console.log('Converting to markdown: START')
    await convertToMarkdown()
    await amendLinks()
    await moveAssets()
    console.log('Converting to markdown: END')
  } catch (error) {
    console.error(`Converting to markdown: ERROR - ${error.message}`)
  }
}

module.exports = {
  initConvertFiles
}
