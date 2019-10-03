/**
 * Creates a Spritesheet
 * @param {string} - Path to the image.
 * @param {number} - Width (in px) of each frame.
 * @param {number} - Height (in px) of each frame.
 * @param {number} - Number of frames per row in spritesheet.
 * @param {number} - Height of a given zone in spritesheet.
 * @param {number} - Width of a given zone in spritesheet.
 */
function SpriteSheetInfo(imageId, frameWidth, frameHeight, framesPerRow, zoneHeight, zoneWidth) {
  this.image = document.getElementById(imageId);
  this.frameWidth = frameWidth;
  this.frameHeight = frameHeight;
  this.framesPerRow = framesPerRow;//Math.floor(this.image.width / this.frameWidth);
  this.zoneHeight = zoneHeight;
  this.zoneWidth = zoneWidth;
}

/**
 * Creates an Sprite Animation
 * @param {SpriteInfo}
 * frameSpeed - Speed of animation (lower is faster).
 * startFrame - Initial animation frame.
 * totalFrames - Total number of frames in animation loop.
 * padding - Padding between each sprite.
 * startPoint - Top left coordinate of the animation's group of sprites.
 * verticalZone - Vertical zone number of the spritesheet.
 * horizontalZone - Horizontal zone number of the spritesheet.
 * spriteSheetInfo - Spritesheet info
 */
function SpriteAnimation(animationInfo) {
  this.frameRow = 0;
  this.frameColumn = 0;
  this.animationSequence = [];  
  this.currentFrame = 0;        
  this.counter = 0;             
  this.frameSpeed = animationInfo.frameSpeed;
  this.padding = animationInfo.padding || 0;
  this.startPoint = animationInfo.startPoint;
  this.verticalZone = animationInfo.verticalZone || 0;
  this.horizontalZone = animationInfo.horizontalZone || 0;
  this.spriteSheetInfo = animationInfo.spriteSheetInfo;
  this.reverse = animationInfo.reverse || false;
  this.endFrame = animationInfo.totalFrames - 1;

  for (var frameNumber = 0; frameNumber < animationInfo.totalFrames; frameNumber++) {
    var t = this.reverse ? animationInfo.startFrame - frameNumber : animationInfo.startFrame + frameNumber;
    var fn = mod(t, animationInfo.totalFrames);
    this.animationSequence.push(fn);
  }
}

SpriteAnimation.prototype = {
  animate: function(){
    this.updateFrame();
    this.setSpriteSheetXY();
  },
  updateFrame: function() {
    if (this.counter == (this.frameSpeed - 1)){
      this.currentFrame = mod((this.currentFrame + 1), this.animationSequence.length);
    }
    this.counter = (this.counter + 1) % this.frameSpeed;
  },
  setSpriteSheetXY: function() {
    var row = ~~(this.animationSequence[this.currentFrame] / this.spriteSheetInfo.framesPerRow);
    var col = ~~(this.animationSequence[this.currentFrame] % this.spriteSheetInfo.framesPerRow);
    this.frameRow =  row * this.spriteSheetInfo.frameWidth + this.startPoint.y + (this.padding * (1 + row)) + (this.verticalZone * this.spriteSheetInfo.zoneHeight);
    this.frameColumn =  col * this.spriteSheetInfo.frameHeight + this.startPoint.x + (this.padding * (1 + col)) + (this.horizontalZone * this.spriteSheetInfo.zoneWidth);
  },
  isAnimationCompleted: function(){
      return this.currentFrame === this.endFrame;
  }
}

function LoopingSpriteAnimation(spriteInfo){
  SpriteAnimation.call(this, spriteInfo);
  this.totalLoops = spriteInfo.loopCount;
  this.loopNumber = 0;
}

LoopingSpriteAnimation.prototype = Object.create(SpriteAnimation.prototype);
LoopingSpriteAnimation.prototype.constructor = LoopingSpriteAnimation;

LoopingSpriteAnimation.prototype.updateLoopNumber = function(){
  if(SpriteAnimation.prototype.isAnimationCompleted.call(this) && this.counter == (this.frameSpeed - 1))
  {
    this.loopNumber++;
  }
}

LoopingSpriteAnimation.prototype.isAnimationCompleted = function(){
  return this.loopNumber === this.totalLoops;
}

LoopingSpriteAnimation.prototype.animate = function(){
  this.updateLoopNumber();
  this.updateFrame();
  this.setSpriteSheetXY();
}

function ChainSpriteAnimation(animationList){
  this.animationChain = animationList;
}

ChainSpriteAnimation.prototype = {
  animate: function() {
    if(this.currentAnimation.isAnimationCompleted()){
      this.currentAnimation = this.animationChain.shift();
    }
    this.currentAnimation.animate();
  },
  isAnimationCompleted: function(){
    return this.animationChain.length === 0 && this.currentAnimation.isAnimationCompleted();
  }
}

/*
custom modulo function since regular modulo function can't handle negative numbers
mod(n, m) is equivalent to n % m
 */
function mod(n, m) {
  return ((n % m) + m) % m;
}