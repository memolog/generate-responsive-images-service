const path = require('path');
const express = require('express');
const sharp = require('sharp');
const mkdirp = require('mkdirp');

const app = express();

const serveStatic = require('serve-static');
const Busboy = require('busboy');

function resizeImage(buffer, size, name, ext, scale) {
  return new Promise((fulfill, reject) => {
    scale = scale || 1;
    ext = ext.replace(/^\./, '');
    const scaleStr = scale === 1 ? '' : `@${scale}`;
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

app.post('/convert', (req, res, next) => {
  const image = {};
  const busboy = new Busboy({ headers: req.headers });
  busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    image.filename = filename;
    image.buffer = '';
    file.setEncoding('base64');
    file.on('data', function(data) {
      image.buffer += data;
    });
    file.on('end', function() {

    });
  });
  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    console.log('Field [' + fieldname + ']: value: ' + inspect(val));
  });
  busboy.on('finish', () => {
    const imagePath = path.parse(image.filename);
    let imageSize = 750;

    const buffer = new Buffer(image.buffer, 'base64');
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
  req.pipe(busboy);
});

app.use(serveStatic(path.join(__dirname, '../static/public')));

console.log(`Start Express Server: localhost:3000`);
app.listen(3000);