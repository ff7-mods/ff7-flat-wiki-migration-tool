const {initDownloadFiles} = require('./download-files.js')
const {initConvertFiles} = require('./convert-files.js')
const {initPackageFiles} = require('./package-files.js')

const init = async () => {
  await initDownloadFiles()
  await initConvertFiles()
  await initPackageFiles()
}
init()
