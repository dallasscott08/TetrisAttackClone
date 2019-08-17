// Surprise! You have to check for endianness in JavaScript
// if you use an arraybuffer in multiple views.
var isLittleEndian = (function () {
    var t16 = new Uint16Array(1);
    var t8 = new Uint8Array(t16.buffer);
    t8[1] = 0xFF;
    return t16[0] === 0xFF00;
})();

/**
 * Creates a Spritesheet
 * @param {Image} - Image to cache.
 * @param {number} - Height of image to cache.
 * @param {number} - Width of image to cache.
 */
function CachedImage(img, height, width){
    img.crossOrigin = true;
    // In memory canvas
    this.iCanvas = document.createElement('canvas');
    this.iCtx = this.iCanvas.getContext('2d');

    // set the canvas to the size of the image
    this.iCanvas.width = width;//img.width;
    this.iCanvas.height = height;//img.height;

    // draw the image onto the canvas
    this.iCtx.drawImage(img, 0, 0, width, height);

    // get the ImageData for the image.
    //this.imageData = this.iCtx.getImageData(0, 0, width, height);
    // get the pixel component data from the image Data.
    //this.imagePixData = new Uint32Array(this.imageData.data.buffer);

    // store our width and height so we can reference it faster.
    this.imgWidth = width;//img.width;
    this.imgHeight = height;//img.height;	
}