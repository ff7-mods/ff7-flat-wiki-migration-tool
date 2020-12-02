const {initDownloadFiles} = require('./download-files.js')
const {initConvertFiles} = require('./convert-files.js')

const init = async () => {
  // await initDownloadFiles()
  await initConvertFiles()
}
init()
