#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const program = require('commander');
const generateImages = require('../generate-images');
const pkg = require('../package.json');

function readFileAndGenerate(filePath, dist, small, medium) {
  return new Promise((fulfill, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      const imagePath = path.parse(filePath);
      generateImages(buffer, {
        dist: dist,
        name: imagePath.name,
        ext: imagePath.ext.replace(/^\./, ''),
        small: small,
        medium: medium
      }).then((filePaths) => {
        fulfill(filePaths);
      }).catch((err) => {
        reject(err);
      })
    });
  });
}

function main(args) {
  program
    .version(pkg.version)
    .option('-i, --input <file>')
    .option('-s, --src <directory>', 'Use files in the directory')
    .option('-d, --dist <dist>')
    .option('--small <n>', 'Width for small image', parseInt)
    .option('--medium <n>', 'Width for medium image', parseInt)
    .parse(args);

  let files = [];
  if (program.src) {
    const dir = path.resolve(program.src);
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.parse(file);
      if (/\.(png|gif|jpe?g)/i.test(filePath.ext)){
        const absolutePath = path.resolve(process.cwd(), `${dir}/${file}`);
        files.push(absolutePath);
      }
    });
  }

  if (program.input) {
    const absolutePath = path.resolve(process.cwd(), program.input);
    files.push(path.resolve(absolutePath));
  }

  const promises = [];
  const dist = path.resolve(process.cwd(), program.dist);
  for (const filePath of files) {
    promises.push(readFileAndGenerate(filePath, dist, program.small, program.medium));
  }

  Promise.all(promises)
    .then((results)=>{
      const resutlStr = results.map((result) => {
        return result.map(filePath => `${dist}/${filePath}`).join('\n');
      }).join('\n');
      process.stdout.write(`${resutlStr}\n`);
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(err.stack + '\n');
      process.exit(1);
    });
}

if (require.main === module) {
  main(process.argv);
}

module.exports = main;
