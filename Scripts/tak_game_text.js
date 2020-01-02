var gameTextCtx;
var multiplierArray = [];
var gameFont; 

const multiplierEffectType = {
    FADE: '0',
    CURVE: '1'
};

const multiplierSettings = {
    effectType: '0',
    endOfLife: 50
};

function MultiplierImage(x,y, multiplier) {
    this.x = x;
    this.y = y;
    this.multiplier = multiplier;
    this.life = 0;
    this.endOfLife = multiplierSettings.endOfLife;
    this.size = blockSize;
    this.alpha = 1;
}

MultiplierImage.prototype = {
    step: function() {
        switch(multiplierSettings.effectType){
            case multiplierEffectType.FADE:
                this.life++;
                this.alpha -= 1/this.endOfLife;
                break;
            case multiplierEffectType.CURVE:
                break;
        }
    },
    clear: function () {
        gameTextCtx.clearRect(this.x, this.y, this.size, this.size);
    },
    draw: function(){
        switch(spriteType){
            case imageType.VECTOR:
            case imageType.PNG:
                this.drawSprite();
                break;
            case imageType.PATH:
                this.drawText();
                break;
        }
    },
    drawSprite: function() {
        gameTextCtx.translate(this.x, this.y);
        gameTextCtx.rotate(this.angle);
        var img = this.flip ? reverseParticleSpriteSheet.image : particleSpriteSheet.image;
        gameTextCtx.drawImage(img,
            this.animation.frameColumn, this.animation.frameRow,
            particleSpriteSheet.frameWidth, particleSpriteSheet.frameHeight,
            -pSettings.particleSize/2, -pSettings.particleSize/2,
            pSettings.particleSize, pSettings.particleSize);
        gameTextCtx.rotate(-this.angle); 
        gameTextCtx.translate(-(this.x), -(this.y));
    },
    drawText: function(){
        gameTextCtx.globalAlpha = this.alpha;
        gameTextCtx.fillText("x" + this.multiplier, this.x, this.y + this.size, this.size); 
    }
}

function setGameFont(){
    var size = 1;
    var fontFamily;
    gameTextCtx.fillStyle = "#ffffff";
    switch(spriteType){
        case imageType.PATH:
            fontFamily = "Lato,'Century Gothic', Arial, sans-serif";
            break;
        case imageType.VECTOR:
            fontFamily = "Lato,'Century Gothic', Arial, sans-serif";
            break;
        case imageType.PNG:
            fontFamily = "PressStart2P,sans-serif";
            break;
    }
    //gameTextCtx.textAlign = "center";
    gameTextCtx.font = size + "px " + fontFamily;
    var width = gameTextCtx.measureText("x99").width;
    while(width < blockSize){
        size++;
        gameTextCtx.font = size + "px " + fontFamily;
        width = gameTextCtx.measureText("x99").width;
    }
}

function setupGameTextCanvas() {
    let gameTextCanvas = document.getElementById("game-text");
    gameTextCanvas.width = gameTextCanvas.clientWidth;
    gameTextCanvas.height = gameTextCanvas.clientHeight;
    gameTextCtx = gameTextCanvas.getContext("2d");

    setGameFont();
}