# Generate Responsive Images Service

The Wrapper module of [Sharp](https://github.com/lovell/sharp) to generate multpile reponsive images at once

## CLI
```npm install -g generate-responsive-images```

### Options
* `-i, --input <File>` input file to generate
* `-d, --dist <Directory>` directory to distribute generated images
* `s, --source <Directory>` source directory to generate
* `--medium <Integer>` Width for medium images (default: 750)
* `--small <Integer>` Width for small images (default: 450)

### Examples
Generate multiple responsive images from a single file
```
generate-responsive-images -i profile.jpg -d dist
```
```
dist/profile/profile_medium.jpg
dist/profile/profile_medium@2x.jpg
dist/profile/profile_medium.webp
dist/profile/profile_medium@2x.webp
dist/profile/profile_small.jpg
dist/profile/profile_small@2x.jpg
dist/profile/profile_small@3x.jpg
```

You can pass directory to generate from mutiple files like the following
```
generate-responsive-images -s directory -d dist
```
```
dist/foo/foo_medium.jpg
dist/foo/foo_medium@2x.jpg
dist/foo/foo_medium.webp
dist/foo/foo_medium@2x.webp
dist/foo/foo_small.jpg
dist/foo/foo_small@2x.jpg
dist/foo/foo_small@3x.jpg
dist/bar/bar_medium.jpg
dist/bar/bar_medium@2x.jpg
dist/bar/bar_medium.webp
dist/bar/bar_medium@2x.webp
dist/bar/bar_small.jpg
dist/bar/bar_small@2x.jpg
dist/bar/bar_small@3x.jpg
```

## Module
```npm install generate-responsive-images```

```
const generateImages = require('generate-responsive-images');
generateImages(Buffer, Options);
```

### Options
* name (required): Image name to generate
* ext (required): Original image Extension
* dist: Directory to distribute generated images (default: current directory)
* relativePath: additional path from distribution (default: `${name}`)
* preset: Image set to generate images (see default-config.json)
* jpeg: Sharp option to generate jpeg image (http://sharp.pixelplumbing.com/en/stable/api-output/#jpeg)
* imageSize: Key/Value set for image size name (see default-config.json)
* medium: override imageSize medium width
* small: override imageSize small width

### Example
```
const generateImages = require('generate-responsive-images');
generateImages(buffer, {
  name: 'foo',
  ext: 'jpg',
  dist: 'dist'
}).then((filePaths) => {

}).catch((err) => {

});
```

also see https://github.com/memolog/generate-responsive-images-server
