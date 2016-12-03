const DEBUG = false

const fs = require('fs')
const inquirer = require('inquirer')
const Github = require('github')
const open = require('open')
const urlPrefix = 'https://glossbossimages.s3.eu-central-1.amazonaws.com/'
const rootFolder = 'glossbossimages/'
const gh = new Github({
  version: '3.0.0'
})
gh.authenticate({
  type: 'oauth',
  token: process.env.GIST_TOKEN
})

function createPrompt (name, message, choices, cb) {
  inquirer.prompt([
    {
      type: 'list',
      name,
      message,
      choices,
      pageSize: 20
    }
  ]).then((answers) => cb(answers))
}
function readDir (dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) reject(err)
      resolve(files)
    })
  })
}

function createMarkdownImage (url, dir) {
  dir = String(dir)
  if (dir[dir.length - 1] !== '/') {
    dir += '/'
  }
  return `![](${urlPrefix + dir + url}) \n\n`
}

function generateGist (data, selectedImageFolder) {
  return new Promise((resolve, reject) => {
    let files = ''
    data.map((file) => {
      if (file.indexOf('DS_Store') > -1) return
      files = files + createMarkdownImage(file, selectedImageFolder.replace('glossbossimages/', ''))
    })
    resolve(files)
  }).then((content) => {
    if (DEBUG) return console.log(content)
    gh.gists.create({
      'description': 'glossboss img',
      'public': false,
      'files': {
        'images.md': {
          'content': content
        }
      }
    }, (err, result) => {
      if (err) throw err
      console.log(result.html_url)
      open(result.html_url)
    })
  })
}

function getImages (dir) {
  // with the selected glossboss, ask for the image folder
  readDir(dir).then((files) => {
    // when the first file is a dir, ask for the subfolder
    // because then i assume there are more subfolders
    if (fs.lstatSync(dir + '/' + files[0]).isDirectory()) {
      return createPrompt('subfolder', 'Select a Subfolder', files, (answer) => {
        getImages(dir + '/' + answer.subfolder)
      })
    }
    // no more folders... render the markdown images
    generateGist(files, dir)
  })
}
function start () {
  readDir(rootFolder)
  .then((files) => {
    // remove root files (images) and only list folders in the prompt
    const rootFolders = files.filter((dir) => dir.indexOf('.') === -1)
    // ask for the root folder
    createPrompt('rootfolder', 'Select a Glossboss', rootFolders, (answer) => {
      getImages(rootFolder + answer.rootfolder)
    })
  })
}

start()
