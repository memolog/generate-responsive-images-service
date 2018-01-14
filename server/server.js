const path = require('path');
const express = require('express');
const app = express();

const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
const generateImages = require('./generate-images');

app.use(bodyParser.raw({
  type: 'image/*',
  limit: '10mb'
}));

app.post('/images', (req, res, next) => {
  const imagePath = path.parse(req.query.name);
  const buffer = req.body;
  generateImages(buffer, {
    name: imagePath.name,
    ext: imagePath.ext.replace(/^\./, '')
  }).then((filePaths) => {
    res.json({
      filePaths: filePaths
    });
  }).catch((err) => {
    res.status(500);
    res.json({
      error: err.message
    });
  });
});

app.use(serveStatic(path.join(__dirname, '../static/public')));

console.log(`Start Express Server: localhost:3000`);
app.listen(3000);
