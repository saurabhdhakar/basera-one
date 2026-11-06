(function () {
  'use strict';
  function drawWatermark(ctx, width, height, color) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-28 * Math.PI / 180);
    ctx.font = '800 ' + Math.max(24, Math.round(Math.min(width, height) * 0.16)) + 'px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.32;
    ctx.fillText('Basera', 0, 0);
    ctx.restore();
  }
  function readFiles(files) {
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve({ file: file, preview: reader.result }); };
        reader.onerror = function () { reject(new Error('Could not read photo')); };
        reader.readAsDataURL(file);
      });
    }));
  }
  window.BaseraPropertyPhotos = { drawWatermark: drawWatermark, readFiles: readFiles };
})();