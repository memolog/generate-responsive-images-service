const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');

function uploadPart(s3bucket, multipart, partParams, multipartMap, tryNum){
  return new Promise((fulfill, reject) => {
    tryNum = tryNum || 1;
    const maxUploadTries = 3;

    s3bucket.uploadPart(partParams, function(err, data){
      if (err) {
        if (tryNum < maxUploadTries) {
          uploadPart(s3bucket, multipart, partParams, multipartMap, tryNum + 1)
            .then(() => {
              fulfill();
            })
            .catch((err) => {
              reject(err);
            });
          return;
        }

        reject(err);
        return;
      }

      const partNumber = parseInt(partParams.PartNumber, 10);
      multipartMap.Parts[partNumber - 1] = {
        ETag: data.ETag,
        PartNumber: partNumber
      };

      fulfill();
    });
  })
}

function upload(data){
  let multipart, multipartMap;

  s3bucket = new AWS.S3({
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    params: {
      Bucket: process.env.Bucket
    }
  });

  return new Promise((fulfill, reject) => {
    s3bucket.createMultipartUpload({
      Key: data.key,
      ContentType: data.contentType
    }, (err, mp) => {
      if (err) {
        reject(err);
        return;
      }
      multipart = mp;
      fulfill()
    })
  })
  .then(() => {
    let partNum = 0;
    const partSize = 1024 * 1024 * 5;
    const promises = [];

    multipartMap = {
      Parts: []
    };

    const bufferLength = data.buffer.length;
    for(let rangeStart = 0; rangeStart < bufferLength; rangeStart += partSize){
      partNum += 1;
      const end = Math.min(rangeStart + partSize, data.buffer.length);
      const partParams = {
        Body: data.buffer.slice(rangeStart, end),
        Key: data.key,
        PartNumber: '' + partNum,
        UploadId: multipart.UploadId
      };
      promises.push(uploadPart(s3bucket, multipart, partParams, multipartMap));
    }

    return Promise.all(promises);
  })
  .then(() => {
    return new Promise((fulfill, reject) => {
      const doneParams = {
        Key: data.key,
        MultipartUpload: multipartMap,
        UploadId: multipart.UploadId
      };

      s3bucket.completeMultipartUpload(doneParams, (err, resp) => {
        if (err) {
          reject(err);
          return;
        }
        fulfill(data.key);
      });
    });
  }).catch((err) => {
    return new Promise((fulfill, reject) => {
      if (!multipart || !multipart.UploadId) {
        reject(err);
        return;
      }
      s3bucket.abortMultipartUpload({
        Key: data.key,
        UploadId: multipart.UploadId
      }, function(abortErr){
        console.log(abortErr);
        reject(err);
      });
    })
  });
}

function generateResizeImageBuffer(data){
  return new Promise((fulfill, reject) => {
    const scale = data.scale || 1;
    const scaleStr = scale === 1 ? '' : `@${scale}x`;
    const key = `${data.name}/${data.name}_${data.size}${scaleStr}.${data.ext}`;

    let sharpObject = data.sharpObject;
    sharpObject = sharpObject.resize(750);
    if (data.ext === 'webp') {
      sharpObject.webp();
    }
    sharpObject.toBuffer((err, buffer) => {
      if (err) {
        reject(err);
        return;
      }
      fulfill({
        key: key,
        buffer: buffer,
        contentType: 'image/jpeg'
      });
    });
  });
}

exports.generate = (event, context, callback) => {
  let s3bucket, multipart, multipartMap;
  const resizeImages = [];
  const query = event.queryStringParameters || {};
  const filename = query.name || '';

  if (!filename) {
    callback(new Error('File name is required'));
    return;
  }

  const size = parseInt(query.size, 10) || 0;
  if (!size) {
    callback(new Error('Size parameter must be integer'));
    return;
  }

  const image = event.body || '';
  if (!image) {
    callback(new Error('Image data is required'));
    return;
  }

  const filePath = path.parse(filename);
  const name = filePath.name;
  const ext = filePath.ext.replace(/^\./, '');
  const origBuffer = Buffer.from(image, 'base64');

  const sharpObject = sharp(origBuffer);
  const promises = [{
    sharpObject: sharpObject,
    size: size,
    name: name,
    ext: ext,
    scale: 1
  }, {
    sharpObject: sharpObject,
    size: 750,
    name: name,
    ext: ext,
    scale: 1
  }, {
    sharpObject: sharpObject,
    size: 750,
    name: name,
    ext: ext,
    scale: 2
  }, {
    sharpObject: sharpObject,
    size: 750,
    name: name,
    ext: 'webp',
    scale: 1
  }, {
    sharpObject: sharpObject,
    size: 750,
    name: name,
    ext: 'webp',
    scale: 2
  }, {
    sharpObject: sharpObject,
    size: 450,
    name: name,
    ext: ext,
    scale: 1
  }, {
    sharpObject: sharpObject,
    size: 450,
    name: name,
    ext: ext,
    scale: 2
  }, {
    sharpObject: sharpObject,
    size: 450,
    name: name,
    ext: ext,
    scale: 3
  }].map(data => generateResizeImageBuffer(data));

  Promise.all(promises).then((resizeImages) => {
    const promises = resizeImages.map(data => upload(data));
    return Promise.all(promises);
  })
  .then((datas) => {
    const filePaths = datas.map(data => `images?key=${encodeURIComponent(data)}`);
    callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin' : '*'
      },
      body: JSON.stringify({
        filePaths: filePaths
      })
    });
  })
  .catch((err) => {
    console.log(err);
    callback(err);
  });
}
