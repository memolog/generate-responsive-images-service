const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mkdirp = require('mkdirp');

function resizeImage(buffer, options, config) {
  return new Promise((fulfill, reject) => {
    const {size, name, ext, scale} = options;
    const scaleStr = scale === 1 ? '' : `@${scale}x`;
    const relativePath = `images/${name}/${name}_${size}${scaleStr}.${ext}`
    const filePath = path.resolve(__dirname, `../static/public/${relativePath}`);

    let sharpObject = sharp(buffer).resize(size * scale);
    if (ext === 'jpg' && config.jpeg) {
      sharpObject = sharpObject.jpeg(config.jpeg);
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
    const dist = options.dist || `../static/public/images/${name}`;

    try {
      const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json'), {encoding: 'utf8'}));

      mkdirp(path.resolve(__dirname, dist), async (err) => {
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
          const result = await resizeImage(buffer, cond, config);
          filePaths.push(result.relativePath);
        }

        fulfill(filePaths);
      });
    } catch (err) {
      reject(err);
    }
  });
}
