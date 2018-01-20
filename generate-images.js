'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mkdirp = require('mkdirp');
const defaultConfig = require('./default-config.json');

function resizeImage(buffer, options, config) {
  return new Promise((fulfill, reject) => {
    const size = options.size;
    const name = options.name;
    const ext = options.ext;
    const scale = options.scale;
    const dist = options.dist;
    const relativePath = options.relativePath;

    const sizeStr = `_${size}`;
    const scaleStr = scale === 1 ? '' : `@${scale}x`;

    const filename = `${name}${sizeStr}${scaleStr}.${ext}`;
    const filePath = `${dist}/${relativePath}/${filename}`;

    const sizeInt = parseInt(config.imageSize[size], 10);
    if (!sizeInt) {
      reject(new Error('The size parameter is invalid'));
      return;
    }

    let sharpObject = sharp(buffer).resize(sizeInt * scale);
    switch (ext) {
      case 'webp':
        sharpObject = sharpObject.webp();
        break;
      case 'png':
        sharpObject = sharpObject.png();
        break;
      default:
        const imageConfig = config.jpeg || {};
        sharpObject = sharpObject.jpeg(imageConfig);
    }

    sharpObject
      .toFile(filePath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fulfill({relativePath: `${relativePath}/${filename}`});
      });
  });
}

module.exports = function generateImages(buffer, options, config){
  return new Promise((fulfill, reject) => {
    const conf = Object.assign(defaultConfig, (config || {}) );
    const name = options.name;
    let dist, relativePath;
    if (options.dist) {
      relativePath = `${name}`;
      dist = options.dist;
    } else {
      relativePath = `images/${name}`
      dist = path.resolve(__dirname, `../static/public`);
    }

    mkdirp(`${dist}/${relativePath}`, (err) => {
      if (err) {
        reject(err);
        return;
      }

      const promises = [];
      const conditions = conf.preset;
      for (const cond of conditions) {
        cond.name = name;
        cond.ext = cond.ext || options.ext;
        cond.scale = parseInt(cond.scale, 10) || 1;
        cond.dist = dist;
        cond.relativePath = relativePath;
        promises.push(resizeImage(buffer, cond, conf));
      }

      Promise.all(promises)
        .then((results) => {
          const relativePaths = results.map(result => result.relativePath);
          fulfill(relativePaths);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}
