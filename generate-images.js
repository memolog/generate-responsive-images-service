"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { mkdirp } = require("mkdirp");
const defaultConfig = require("./default-config.json");

function resizeImage(buffer, options) {
  return new Promise(async (fulfill, reject) => {
    const { size, name, ext, scale, dist, relativePath, sizeString } = options;
    let {cropWidth, cropHeight } = options;
    const sizeStr = sizeString ? `_${size}` : "";
    const scaleStr = scale === 1 ? "" : `@${scale}x`;

    const filename = `${name}${sizeStr}${scaleStr}.${ext}`;
    const filePath = `${dist}/${relativePath}/${filename}`;

    const sizeInt = parseInt(options.imageSize[size], 10);
    if (!sizeInt) {
      reject(new Error("The size parameter is invalid"));
      return;
    }

    const sharpObject = sharp(buffer);
    const { width, height } = await sharpObject.metadata();

    if (cropWidth || cropHeight) {
      cropWidth = (cropWidth || width) * scale;
      cropHeight = (cropHeight || height) * scale;
      sharpObject.resize(cropWidth, cropHeight, {
        fit: "cover",
        position: "center"
      });
    } else {
      sharpObject.resize(sizeInt * scale);
    }

    switch (ext) {
      case "webp":
        sharpObject.webp();
        break;
      case "png":
        sharpObject.png();
        break;
      default:
        const imageConfig = options.jpeg || {};
        sharpObject.jpeg(imageConfig);
    }

    sharpObject.toFile(filePath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      fulfill({ relativePath: `${relativePath}/${filename}` });
    });
  });
}

module.exports = async function generateImages(buffer, options) {
  return new Promise(async (fulfill, reject) => {
    const opts = Object.assign(defaultConfig, options || {});
    const name = opts.name;

    let dist, relativePath;
    if (opts.dist) {
      relativePath = opts.relativePath || `${name}`;
      dist = opts.dist;
    } else {
      relativePath = opts.relativePath || `${name}`;
      dist = path.resolve(process.cwd(), "/");
    }

    if (opts.medium) {
      opts.imageSize.medium =
        parseInt(opts.medium, 10) || opts.imageSize.medium;
    }

    if (opts.small) {
      opts.imageSize.small = parseInt(opts.small, 10) || opts.imageSize.small;
    }

    try {
      // ディレクトリが存在している場合は中身をすべて削除する
      if (fs.existsSync(`${dist}/${relativePath}`)) {
        if (opts.clean) {
          fs.readdirSync(`${dist}/${relativePath}`).forEach((file) => {
            fs.unlinkSync(`${dist}/${relativePath}/${file}`);
          });
        }
      } else {
        // ディレクトリが存在しない場合は作成する
        fs.mkdirSync(`${dist}/${relativePath}`, { recursive: true });
      }

      // mkdirpのPromiseベースのAPIを使用
      await mkdirp(`${dist}/${relativePath}`);

      const promises = [];
      const conditions = opts.preset;
      for (const cond of conditions) {
        cond.name = name;
        cond.ext = cond.ext || opts.ext;
        cond.scale = parseInt(cond.scale, 10) || 1;
        cond.dist = dist;
        cond.relativePath = relativePath;
        cond.imageSize = opts.imageSize;
        cond.cropWidth = opts.cropWidth;
        cond.cropHeight = opts.cropHeight;
        cond.sizeString = opts.sizeString;
        promises.push(resizeImage(buffer, cond));
      }

      const results = await Promise.all(promises);
      const relativePaths = results.map((result) => result.relativePath);
      fulfill(relativePaths);
    } catch (err) {
      reject(err);
    }
  });
};
