const path = require('path');
const express = require('express');
const sharp = require('sharp');
const mkdirp = require('mkdirp');

const app = express();

const serveStatic = require('serve-static');
const bodyParser = require('body-parser');

function resizeImage(buffer, size, name, ext, scale) {
  return new Promise((fulfill, reject) => {
    scale = scale || 1;
    ext = ext.replace(/^\./, '');
    const scaleStr = scale === 1 ? '' : `@${scale}x`;
    const relativePath = `images/${name}/${name}_${size}${scaleStr}.${ext}`
    const filePath = path.resolve(__dirname, `../static/public/${relativePath}`);
  
    sharp(buffer)
      .resize(size * scale)
      .toFile(filePath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        fulfill(relativePath);
      });
  });
}

app.use(bodyParser.raw({
  type: 'image/*',
  limit: '10mb'
}));

app.post('/images', (req, res, next) => {
  const image = {};
  const imagePath = path.parse(req.query.name);
  let imageSize = parseInt(req.query.size, 10) || 750;

  const buffer = req.body;
  try {
    mkdirp(path.resolve(__dirname, `../static/public/images/${imagePath.name}`), async (err) => {
      if (err) {
        res.status(500);
        res.json({
          error: err.message
        });
        return;
      }
      const conditions = [{
        size: 750,
        ext: imagePath.ext,
        scale: 1
      }, {
        size: 750,
        ext: imagePath.ext,
        scale: 2          
      }, {
        size: 750,
        ext: 'webp',
        scale: 1
      }, {
        size: 750,
        ext: 'webp',
        scale: 2
      }, {
        size: 450,
        ext: imagePath.ext,
        scale: 1
      }, {
        size: 450,
        ext: imagePath.ext,
        scale: 2
      }, {
        size: 450,
        ext: imagePath.ext,
        scale: 3
      }];

      const filePaths = [];
      for (const cond of conditions) {
        const filePath = await resizeImage(buffer, cond.size, imagePath.name, cond.ext, cond.scale);
        filePaths.push(filePath);
      }
      res.json({
        filePaths: filePaths
      });
    })
  } catch (err) {
    res.status(500);
    res.json({
      error: err.message
    });
    return;
  }
});

app.use(serveStatic(path.join(__dirname, '../static/public')));

console.log(`Start Express Server: localhost:3000`);
app.listen(3000);