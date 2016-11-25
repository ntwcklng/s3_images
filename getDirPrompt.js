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
      choices
    }
  ]).then((answers) => cb(answers))
}
function readDir (dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) throw err
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

readDir(rootFolder)
.then((files) => {
  const rootFolders = files.filter((dir) => dir.indexOf('.') === -1)
  createPrompt('rootfolder', 'Select a root folder', rootFolders, (answer) => {
    const selectedRootFolder = rootFolder + answer.rootfolder
    readDir(selectedRootFolder)
    .then((imageFolders) => {
      createPrompt('imagefolder', 'Select a image folder', imageFolders, (answer) => {
        const selectedImageFolder = selectedRootFolder + '/' + answer.imagefolder
        readDir(selectedImageFolder)
        .then((data) => {
          return new Promise((resolve, reject) => {
            let files = ''
            data.map((file) => {
              if (file.indexOf('DS_Store') > -1) return
              files = files + createMarkdownImage(file, selectedImageFolder.replace('glossbossimages/', ''))
            })
            resolve(files)
          }).then((content) => {
            console.log(content)
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
        })
      })
    })
  })
})

