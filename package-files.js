const pandoc = require('node-pandoc-promise')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob-promise')

const TEMPLATE_DIR = './github-pages-template'
const MARKDOWN_DIR = `./output/markdown`
const OUTPUT_DIR = `./output/github-pages`

const copyTemplateFiles = async () => {
  await fs.copy(TEMPLATE_DIR, OUTPUT_DIR)
}
const copyAssets = async () => {
  await fs.copy(path.join(MARKDOWN_DIR, 'ff7-flat-wiki'), path.join(OUTPUT_DIR, 'docs'))
  await fs.move(path.join(OUTPUT_DIR, 'docs', 'Main_Page.md'), path.join(OUTPUT_DIR, 'docs', 'index.md'))
}
const initPackageFiles = async () => {
  try {
    console.log('Packaging files for github pages: START')
    await fs.emptyDir(OUTPUT_DIR)
    await copyTemplateFiles()
    await copyAssets()
    console.log('Packaging files for github pages: END')
  } catch (error) {
    console.error(`Packaging files for github pages: ERROR - ${error.message}`)
  }
}

module.exports = {
  initPackageFiles
}
