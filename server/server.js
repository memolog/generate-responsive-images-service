const path = require('path');
const express = require('express');
const sharp = require('sharp');

const app = express();

const serveStatic = require('serve-static');
const Busboy = require('busboy');

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
  busboy.on('finish', function() {
    const imagePath = path.parse(image.filename);
    let imageSize = 750;
    sharp(new Buffer(image.buffer, 'base64'))
      .resize(imageSize)
      .toFile(path.resolve(__dirname, `../static/public/images/${imagePath.name}_${imageSize}${imagePath.ext}`), (err) => {
        if (err) {
          res.status(500);
          res.json({
            error: err.message
          });
          return;
        }

        res.json({
          success: true
        });
      });
  });
  req.pipe(busboy);
});

app.use(serveStatic(path.join(__dirname, '../static/public')));

console.log(`Start Express Server: localhost:3000`);
app.listen(3000);