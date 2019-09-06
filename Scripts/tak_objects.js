function SkinSettings(){
    this.blockSpriteSize = 16;//32;//
    this.selectorSpriteHeight = 21.6;//43.2;//
    this.selectorSpriteWidth = 36;//72;//
    this.spriteSheetSpriteOffset = 3;//6;//
    this.selectorSpriteSheetSpriteXOffset = 136;//272;//
    this.spriteSheet = "old-sprites";//"effectsprites";//
    this.guideColor = "#FFFFFF";
    this.selectorVector = "selector-vector";
}

function Coordinates(row, column) {
    this.row = row;
    this.column = column;
}

function Timer() {
    this.last = null;
    this.elapsed = 0;
}

Timer.prototype = {
    tick: function (now) {
        this.last = this.last || now;
        this.elapsed = now - this.last;
    }
};

function BlockSprite(options) {
    this.size = blockSize;
    this.spriteSize = skinSettings.blockSpriteSize;//16;
    this.blockType = options.blockType;
    this.row = options.row;
    this.column = options.column;
    this.xPos = options.column * blockSize + this.calculateXOffset();
    this.yPos = options.row;
    this.animation = null;
}

BlockSprite.prototype = {
    clear: function () {
        ctx.clearRect(this.xPos, this.yPos * blockSize, this.size, this.size);
    },
    clearRiseOffset: function () {
        var offSet = riseOffset;
        ctx.clearRect(this.xPos, (this.yPos - offSet) * blockSize, this.size, this.size);
    },
    clearFallOffset: function () {
        var temp = riseOffset - fallOffset;
        var offSet = this.yPos - temp - yFallAmt;
        ctx.clearRect(this.xPos, offSet * blockSize, this.size, this.size);
    },
    drawNoOffset: function(){
        var y = this.yPos * blockSize;
        this.draw(y);
    },    
    drawRiseOffset: function () {
       var y = (this.yPos - riseOffset) * blockSize;
       this.draw(y);
    },
    drawFallOffset: function () {
       var riseFallDiff = riseOffset - fallOffset;
       var offset = this.yPos - riseFallDiff;
       var y = offset * blockSize;
       this.draw(y);
    },
    draw: function(y){
        switch(spriteType){
            case imageType.VECTOR:
                this.drawVector(y);
                break;
            case imageType.PNG:
                this.drawSprite(y);
                break;
            case imageType.PATH:
                this.drawRect(y);
                break;
        }
    },
    drawVector: function(y){
        var vector = this.getBlockVectorFromType();
        ctx.drawImage(vector, this.xPos, y);
    },
    drawSprite: function(y){
       this.determineXY(y);
       ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
           this.pixelsLeft, this.pixelsTop,
           this.spriteSize, this.spriteSize,
           this.xPos, y,
           this.size, this.size);
    },
    drawRect: function(y){
        var color = getColorProperties(this.blockType);
        var gradient = ctx.createLinearGradient(this.xPos, y + this.size, 
            this.xPos + this.size, y);        
        gradient.addColorStop(0, color.body);
        gradient.addColorStop(1, "Transparent");
        ctx.lineWidth = 2;
        ctx.fillStyle = gradient;//color.body;
        ctx.strokeStyle = color.highlight;
        roundRect(ctx, this.xPos, y, this.size, this.size, 10, true, true);

        //draw arc
        var radiusPercent = .9;
        ctx.save();
        ctx.beginPath();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = color.highlight;
        ctx.arc(this.xPos + (this.size)/2, y + (this.size)/2, 
        this.size - ~~(this.size * radiusPercent + 0.5), 0, Math.PI*2, true); 
        ctx.globalAlpha = circleAlpha;
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },
    determineXY: function (y) {
        if(this.animation != null){
            this.animation.updateFrame();
            this.animation.setSpriteSheetXY(blockBounceSprites, 3, {x: 0, y: 0}, 0, this.blockType);
            this.pixelsLeft = this.animation.frameColumn;
            this.pixelsTop = this.animation.frameRow;
            if(this.animation.currentFrame === this.animation.animationSequence.length -1)
                this.animation = null;
        }
        else{
            this.pixelsLeft = (this.spriteSize * this.blockType) + (skinSettings.spriteSheetSpriteOffset * (1 + this.blockType));
            this.pixelsTop = y < canvasHeight - blockSize ? this.pixelsTop = skinSettings.spriteSheetSpriteOffset : (this.spriteSize * 4) + (skinSettings.spriteSheetSpriteOffset * 5);
        }
    },
    calculateXOffset: function () {
        var offSet =  isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
        return ~~(offSet + 0.5);
    },
    getBlockVectorFromType: function(){
        switch(this.blockType) {
            case 0://Green
                return cachedCubeImages.greenCube.iCanvas;
            case 1://Purple
                return cachedCubeImages.purpleCube.iCanvas;
            case 2://Red
                return cachedCubeImages.redCube.iCanvas;
            case 3://Yellow
                return cachedCubeImages.yellowCube.iCanvas;
            case 4://Light Blue
                return cachedCubeImages.lightBlueCube.iCanvas;
            case 5://Dark Blue
                return cachedCubeImages.darkBlueCube.iCanvas;
        }
    }
};

function Block(row, column, blockType, isFalling) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new BlockSprite({ blockType: blockType, row: row, column: column });
    this.isFalling = isFalling || false;
    this.isOffscreen = false;
    this.isSelected = false;
}

function SelectorSprite(options) {
    this.row = options.row;
    this.column = options.column;
    this.xPos = options.column;
    this.yPos = options.row;
    this.spriteWidth = skinSettings.selectorSpriteWidth;
    this.spriteHeight = skinSettings.selectorSpriteHeight;
    this.canvasWidth = ~~((blockSize * skinSettings.widthMultiplier) + 0.5);
    this.canvasHeight = ~~((blockSize * skinSettings.heightMultiplier) + 0.5);
    this.canvasX = ~~((options.column * blockSize + blockSize) - (this.canvasWidth / 2) + 0.5) + this.calculateXOffset();
}

SelectorSprite.prototype = {
    clear: function () {
        selectorCtx.clearRect(this.canvasX-10, this.calculateCanvasY() - 10, this.canvasWidth + 20, this.canvasHeight + 20);
    },
    clearOffset: function () {
        this.yPos += (yRiseAmt * riseTickCounter);
        selectorCtx.clearRect(this.canvasX -10, this.calculateCanvasY() - 10, this.canvasWidth + 20, this.canvasHeight + 20);
    },
    drawNoOffset: function () {
        this.draw(this.calculateCanvasY());
    },
    drawOffset: function () {
        this.yPos -= (yRiseAmt * riseTickCounter);
        this.draw(this.calculateCanvasY());
    },
    draw: function(y){
        switch(spriteType){
            case imageType.VECTOR:
                this.drawVector(y);
                break;
            case imageType.PNG:
                this.drawSprite(y);
                break;
            case imageType.PATH:
                this.drawSelector(y);
                break;
        }
    },
    drawVector: function(y){
        selectorCtx.drawImage(cachedCubeImages.selector.iCanvas, this.canvasX, y);
    },
    drawSprite: function(y) {
        this.determineXY();
        selectorCtx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            this.canvasX, y,
            this.canvasWidth, this.canvasHeight);
    },
    drawSelector: function(y) {
        selectorCtx.lineWidth = 5;
        selectorCtx.fillStyle = "Transparent";
        selectorCtx.strokeStyle = "White";
        var secondX = this.canvasX + this.canvasWidth/2;
        roundRect(selectorCtx, this.canvasX, y, this.canvasWidth/2, this.canvasHeight, 5, true, true, false);
        roundRect(selectorCtx, secondX, y, this.canvasWidth/2, this.canvasHeight, 5, true, true, false);
        var gapPercent = .5;
        var bufferPercent = (1 - gapPercent) / 2;
        var halfWidth = this.canvasWidth/2;
        var verticalGapWidth = ~~(halfWidth * gapPercent + 0.5);
        var verticalGapStart = ~~(halfWidth * bufferPercent + 0.5);
        var horizontalGapHeight = ~~(this.canvasHeight * gapPercent + 0.5);
        var horizontalGapStart = ~~(this.canvasHeight * bufferPercent + 0.5);
        selectorCtx.clearRect(this.canvasX + verticalGapStart, y - 10, verticalGapWidth, this.canvasHeight + 20);
        selectorCtx.clearRect(this.canvasX - 10, y + horizontalGapStart, this.canvasWidth + 20, horizontalGapHeight);
        selectorCtx.clearRect(this.canvasX + halfWidth + verticalGapStart, y - 10, verticalGapWidth, this.canvasHeight + 20);
    },
    determineXY: function () {
        this.pixelsLeft = skinSettings.selectorSpriteSheetSpriteXOffset;
        this.pixelsTop = skinSettings.spriteSheetSpriteOffset;
    },
    calculateXOffset: function () {
        var offSet = isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
        return ~~(offSet + 0.5);
    },
    calculateCanvasY: function(){
        return ~~((this.yPos * blockSize + (blockSize / 2)) - (this.canvasHeight / 2) + 0.5);
    }
};

function Selector(coordinates) {
    this.coordinates = coordinates;
    this.coordinates2 = new Coordinates(coordinates.row, coordinates.column + 1);
    this.sprite = new SelectorSprite({ row: coordinates.row, column: coordinates.column });
}

function setSelectorSizeMultiplier(){
    switch(spriteType){
        case imageType.VECTOR:
            skinSettings.widthMultiplier = 2.1;
            skinSettings.heightMultiplier = 1.1;
            break;
        case imageType.PATH:
            skinSettings.widthMultiplier = 2.25;
            skinSettings.heightMultiplier = 1.15;
            break;
        case imageType.PNG:
            skinSettings.widthMultiplier = 2.25;
            skinSettings.heightMultiplier = 1.35;
            break;
    }
}

function GarbageSprite(options) {
    this.size = blockSize;
    this.spriteSize = skinSettings.blockSpriteSize;
    this.blockType = options.blockType;
    this.row = options.row;
    this.spriteWidth = this.spriteSize * options.width;
    this.canvasWidth = blockSize * options.width;
    this.xPos = options.column * blockSize + this.calculateXOffset();
    this.yPos = options.row;
}

GarbageSprite.prototype = {
    clear: function () {
        ctx.clearRect(this.xPos, this.yPos * blockSize, this.canvasWidth, this.size + 1);
    },
    clearRiseOffset: function () {
        var offSet = riseOffset;
        ctx.clearRect(this.xPos, (this.yPos - offSet) * blockSize, this.canvasWidth, this.size + 1);
    },
    clearFallOffset: function () {
        var temp = riseOffset - fallOffset;
        var offSet = this.yPos - temp - yFallAmt;
        ctx.clearRect(this.xPos, offSet * blockSize, this.canvasWidth, this.size);
    },
    drawNoOffset: function () {
        this.determineXY();
        this.draw(this.yPos * blockSize);
    },
    drawRiseOffset: function () {
        this.determineXY();
        this.draw((this.yPos - riseOffset) * blockSize);
    },
    drawFallOffset: function () {
        this.determineXY();
        var temp = riseOffset - fallOffset;
        var offset = this.yPos - temp;
        this.draw(offset * blockSize);
    },
    draw: function(y){
        switch(spriteType){
            case imageType.VECTOR:
                this.drawVector(y);
                break;
            case imageType.PNG:
                this.drawSprite(y);
                break;
            case imageType.PATH:
                this.drawRect(y);
                break;
        }
    },
    drawVector: function(y){
        var vector = this.getBlockVectorFromType();
        ctx.drawImage(vector,
            this.xPos, y,
            this.canvasWidth, this.size);
    },
    drawSprite: function(y){
       this.determineXY();
       ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
           this.pixelsLeft, this.pixelsTop,
           this.spriteWidth, this.spriteSize,
           this.xPos, y,
           this.canvasWidth, this.size);
    },
    drawRect: function(y){
        var color = getColorProperties(5);
        var gradient = ctx.createLinearGradient(this.xPos, y + this.size, 
            this.xPos + this.canvasWidth, y);        
        gradient.addColorStop(0, color.body);
        gradient.addColorStop(1, "Transparent");
        ctx.lineWidth = 2;
        ctx.fillStyle = gradient;//color.body;
        ctx.strokeStyle = color.highlight;
        roundRect(ctx, this.xPos, y, this.canvasWidth, this.size, 10, true, true);
    },
    determineXY: function () {
        var absBlockType = Math.abs(this.blockType);
        this.pixelsLeft = skinSettings.spriteSheetSpriteOffset;
        this.pixelsTop = (this.spriteSize * absBlockType) + (skinSettings.spriteSheetSpriteOffset * (1 + absBlockType)) + 133;
    },
    calculateXOffset: function () {
        var offSet = isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
        return ~~(offSet + 0.5);
    },
    getBlockVectorFromType: function(){
        switch(this.blockType) {
            case -1:
                return cachedCubeImages.garbage1.iCanvas;//document.getElementById("garbage1");
            case -2:
                return cachedCubeImages.garbage2.iCanvas;//document.getElementById("garbage2");
            case -3:
                return cachedCubeImages.garbage3.iCanvas;//document.getElementById("garbage3");
            case -4:
                return cachedCubeImages.garbage4.iCanvas;//document.getElementById("garbage4");
        }
    }
};

function Garbage(row, startColumn, width, blockType) {
    this.blockType = blockType;
    this.row = row;
    this.column = startColumn;
    this.width = width;
    this.sprite = new GarbageSprite({ blockType: blockType, row: row, column: startColumn, width: width });
    this.isFalling = false;
    this.isOffscreen = false;
    this.isSelected = false;
    this.coords = this.buildGarbageCoords();
}

Garbage.prototype = {
    buildGarbage: function (falling) {
        matrix[this.row][this.column] = this;
        for (var c = 1; c < this.coords.length; c++) {
            var coord = this.coords[c];
            matrix[coord.row][coord.column] = new Block(coord.row, coord.column, this.blockType);
            matrix[coord.row][coord.column].isFalling = falling;
        }
    },
    buildGarbageCoords: function() {
        var coordinatesArray = [];
        for (var c = 0; c < this.width; c++) {
            coordinatesArray.push(new Coordinates(this.row, this.column + c));
        }
        return coordinatesArray;
    }
};

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object 
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke, insideStroke) {
    if (typeof stroke == 'undefined') {
      stroke = true;
    }
    if (typeof insideStroke == 'undefined') {
        insideStroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }

    var lineSize = insideStroke ? ctx.lineWidth - 1 : 1;

    ctx.beginPath();
    ctx.moveTo(x + radius.tl + lineSize, y + lineSize);
    ctx.lineTo(x + width - radius.tr - lineSize, y + lineSize);
    ctx.quadraticCurveTo(x + width - lineSize, y + lineSize, x + width - lineSize, y + radius.tr + lineSize);
    ctx.lineTo(x + width - lineSize, y + height - radius.br - lineSize);
    ctx.quadraticCurveTo(x + width - lineSize, y + height - lineSize, x + width - radius.br - lineSize, y + height - lineSize);
    ctx.lineTo(x + radius.bl + lineSize, y + height - lineSize);
    ctx.quadraticCurveTo(x + lineSize, y + height - lineSize, x + lineSize, y + height - radius.bl - lineSize);
    ctx.lineTo(x + lineSize, y + radius.tl + lineSize);
    ctx.quadraticCurveTo(x + lineSize, y + lineSize, x + radius.tl + lineSize, y + lineSize);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }  
}