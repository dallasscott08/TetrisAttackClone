var pngdVectors = new Map();
var cachedVectors = new Map();

// Surprise! You have to check for endianness in JavaScript
// if you use an arraybuffer in multiple views.
var isLittleEndian = (function () {
    var t16 = new Uint16Array(1);
    var t8 = new Uint8Array(t16.buffer);
    t8[1] = 0xFF;
    return t16[0] === 0xFF00;
})();

/**
 * Caches a list of DOM images
 * @param {Array} - Images to cache.
 * @param {number} - Height of image to cache.
 * @param {number} - Width of image to cache.
 */
function cacheRasterImagesList(domImglist, height, width){
    var cachedImages = [];
    for(var i = 0; i < domImglist.length; i++){
        cachedImages.push(new CachedRasterImage(domImglist[i], height, width, true));
    }
    return cachedImages;
}

/**
 * Creates a PNG from a vector inside global cache of PNGs
 * Don't implement ability to pull SVG string from "external" SVG file.
 * SVG needs to be embeded in the HTML or in an object/cached for security reasons
 * @param {string} - Key for svg string.
 * @param {string} - String version of the SVG to Cache whose imageData needs to be accessed.
 * @param {number} - Height of image to cache.
 * @param {number} - Width of image to cache.
 */ 
function CreatePNGFromVector(key, svgString, height, width){
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var DOMURL = self.URL || self.webkitURL || self;
    var img = new Image();
    var svg = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
    var url = DOMURL.createObjectURL(svg);
    img.onload = function() {
        ctx.drawImage(img, 0, 0, width, height);
        var pngUrl = canvas.toDataURL("image/png");
        img.innerHTML = '<img src="' + pngUrl + '"/>';
        //creating new Image object to avoid infinite loop
        //TODO: investigate why the infinite loop happens
        var i = new Image();
        i.crossOrigin = true;
        i.src = pngUrl;
        pngdVectors.set(key, i);
        DOMURL.revokeObjectURL(pngUrl);
    };
    img.src = url;
}

function AttachOnloadListenersToCachedPNGs(images){
    images.forEach((img, key) => {
        img.onload = () => {
            cachedVectors.set(key, new CachedRasterImage(img, img.height, img.width, false));
        }
    });
}

/**
 * Caches a DOM image
 * @param {Image} - Image to cache.
 * @param {number} - Height of image to cache.
 * @param {number} - Width of image to cache.
 * @param {boolean} - Image data within external vectors cannot be accessed due to CORS restrictions
 */ 
 function CachedRasterImage(img, height, width, isExternalVector) {
    // In memory canvas
    this.iCanvas = document.createElement('canvas');
    this.iCtx = this.iCanvas.getContext('2d');
 
    // set the canvas to the size of the image
    this.iCanvas.width = width;//img.width;
    this.iCanvas.height = height;//img.height;
 
    // draw the image onto the canvas
    this.iCtx.drawImage(img, 0, 0, width, height);
 
    if(!isExternalVector){
        // get the ImageData for the image.
        this.imageData = this.iCtx.getImageData(0, 0, width, height);
        // get the pixel component data from the image Data.
        this.imagePixData = new Uint32Array(this.imageData.data.buffer);
    }
 
    // store our width and height so we can reference it faster.
    this.imgWidth = width;//img.width;
    this.imgHeight = height;//img.height;  
 }