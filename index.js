'use strict'

const fs = require('fs')
const readline = require('readline')
const Github = require('github')
const open = require('open')

const dirPrefix = 'glossbossimages/'
const urlPrefix = 'https://glossbossimages.s3.eu-central-1.amazonaws.com/'
let files = ''

const gh = new Github({
  version: '3.0.0'
})
gh.authenticate({
  type: 'oauth',
  token: process.env.GIST_TOKEN
})

const getDir = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function createMarkdownImage (url, dir) {
  dir = String(dir)
  if (dir[dir.length - 1] !== '/') {
    dir += '/'
  }
  return `![](${urlPrefix + dir + url}) \n\n`
}

function parseDir (dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPrefix + dir, (err, data) => {
      if (err) throw err
      resolve(data)
    })
    getDir.close()
  })
}
function askForDir () {
  getDir.question('Enter Dir: [name/dir] \n', (dir) => {
    parseDir(dir).then((data) => {
      return new Promise((resolve, reject) => {
        data.map((file) => {
          if (file.indexOf('DS_Store') > -1) return
          files = files + createMarkdownImage(file, dir)
        })
        resolve(files)
      })
    }).then((content) => {
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
}

askForDir()
