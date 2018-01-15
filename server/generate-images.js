const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mkdirp = require('mkdirp');
const config = require('./config.json');

function resizeImage(buffer, options) {
  return new Promise((fulfill, reject) => {
    const {size, name, ext, scale, dist} = options;
    const sizeStr = `_${size}`;
    const scaleStr = scale === 1 ? '' : `@${scale}x`;
    let relativePath, filePath;
    if (dist) {
      relativePath = `/${name}/${name}${sizeStr}${scaleStr}.${ext}`
      filePath = path.resolve(__dirname, `${options.dist}${relativePath}`);
    } else {
      relativePath = `images/${name}/${name}${sizeStr}${scaleStr}.${ext}`
      filePath = path.resolve(__dirname, `../static/public/${relativePath}`);
    }

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
        fulfill({relativePath});
      });
  });
}

module.exports = function generateImages(buffer, options){
  return new Promise((fulfill, reject) => {
    const name = options.name;
    const dist =  (options.dist || '../static/public/images') + `/${name}`;

    try {
      mkdirp(path.resolve(__dirname, dist), (err) => {
        if (err) {
          reject(err);
          return;
        }

        fs.writeFile(path.resolve(__dirname, `${dist}/${name}.${options.ext}`), buffer, async (err) => {
          if (err) {
            reject(err);
            return;
          }

          const conditions = config.preset;

          const filePaths = [];
          for (const cond of conditions) {
            cond.name = name;
            cond.ext = cond.ext || options.ext;
            cond.scale = parseInt(cond.scale, 10) || 1;
            cond.dist = options.dist;
            const result = await resizeImage(buffer, cond);
            filePaths.push(result.relativePath);
          }

          fulfill(filePaths);
        })
      });
    } catch (err) {
      reject(err);
    }
  });
}
