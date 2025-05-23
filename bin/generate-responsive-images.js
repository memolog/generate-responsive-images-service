#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const { Command } = require('commander');
const generateImages = require('../generate-images');
const pkg = require('../package.json');

function readFileAndGenerate(filePath, dist, options) {
  const { webpOnly } = options;
  return new Promise((fulfill, reject) => {
    fs.readFile(filePath, (err, buffer) => {
      if (err) return reject(err);
      const imagePath = path.parse(filePath);
      const opts = {
        ...options,
        dist,
        name: imagePath.name,
        ext: imagePath.ext.replace(/^\./, ''),
      };
      if (webpOnly) {
        opts.preset = [{
          "size": "medium",
          "ext": "webp"
        }, {
          "size": "medium",
          "ext": "webp",
          "scale": 2
        }];
      }
      generateImages(buffer, opts).then((filePaths) => {
        fulfill(filePaths);
      }).catch((err) => {
        reject(err);
      });
    });
  });
}

async function main(args) {
  const program = new Command();

  program
    .version(pkg.version)
    .requiredOption('-d, --dist <dist>', 'Output directory')
    .option('-i, --input <file>', 'Input file')
    .option('-s, --src <directory>', 'Use files in the directory')
    .option('--small <n>', 'Width for small image', parseInt)
    .option('--medium <n>', 'Width for medium image', parseInt)
    .option('--webp-only', 'Generate only webp image')
    .option('--clean', 'Remove existing files in the directory and then generate files')
    .option('--crop-width <n>', 'Width for cropping', parseInt)
    .option('--crop-height <n>', 'Height for cropping', parseInt)
    .option('--no-size-string', 'Do not add size string to the filename');

  await program.parseAsync(args);
  const options = program.opts();

  let files = [];
  if (options.src) {
    const dir = path.resolve(options.src);
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.parse(file);
      if (/\.(png|gif|jpe?g)/i.test(filePath.ext)) {
        const absolutePath = path.resolve(process.cwd(), `${dir}/${file}`);
        files.push(absolutePath);
      }
    });
  }

  if (options.input) {
    const absolutePath = path.resolve(process.cwd(), options.input);
    files.push(absolutePath);
  }

  const promises = [];
  const dist = path.resolve(process.cwd(), options.dist);
  for (const filePath of files) {
    promises.push(readFileAndGenerate(filePath, dist, options));
  }

  try {
    const results = await Promise.all(promises);
    const resultStr = results.map((result) => {
      return result.map(filePath => `${dist}/${filePath}`).join('\n');
    }).join('\n');
    process.stdout.write(`${resultStr}\n`);
    process.exit(0);
  } catch (err) {
    process.stderr.write(err.stack + '\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv);
}

module.exports = main;
