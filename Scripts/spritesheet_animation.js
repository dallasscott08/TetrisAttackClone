/**
 * Creates a Spritesheet
 * @param {string} - Path to the image.
 * @param {number} - Width (in px) of each frame.
 * @param {number} - Height (in px) of each frame.
 * @param {number} - Number of frames per row in spritesheet.
 * @param {number} - Height of a given zone in spritesheet.
 * @param {number} - Width of a given zone in spritesheet.
 */
function SpriteGroup(imageId, frameWidth, frameHeight, framesPerRow, zoneHeight, zoneWidth) {
  this.image = document.getElementById(imageId);
  this.frameWidth = frameWidth;
  this.frameHeight = frameHeight;
  this.framesPerRow = framesPerRow;//Math.floor(this.image.width / this.frameWidth);
  this.zoneHeight = zoneHeight;
  this.zoneWidth = zoneWidth;
}

function Animation(frameSpeed, startFrame, endFrame) {
  this.frameRow = 0;
  this.frameColumn = 0;
  this.animationSequence = [];  
  this.currentFrame = 0;        
  this.counter = 0;             
  this.frameSpeed = frameSpeed;

  for (var frameNumber = startFrame; frameNumber < endFrame; frameNumber++) {
    this.animationSequence.push(frameNumber);
  }
}

Animation.prototype = {
  updateFrame: function() {
    if (this.counter == (this.frameSpeed - 1)){
      this.currentFrame = (this.currentFrame + 1) % this.animationSequence.length;
    }
    this.counter = (this.counter + 1) % this.frameSpeed;
  },
  setSpriteSheetXY: function(spriteGroup, padding, startPoint, verticalZone, horizontalZone) {
    var row = ~~(this.animationSequence[this.currentFrame] / spriteGroup.framesPerRow);
    var col = ~~(this.animationSequence[this.currentFrame] % spriteGroup.framesPerRow);
    this.frameRow =  row * spriteGroup.frameWidth + startPoint.y + (padding * (1 + row)) + (verticalZone * spriteGroup.zoneHeight);
    this.frameColumn =  col * spriteGroup.frameHeight + startPoint.x + (padding * (1 + col)) + (horizontalZone * spriteGroup.zoneWidth);
  }
}