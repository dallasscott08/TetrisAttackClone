var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yRiseAmt, yFallAmt, constMoveAmt, timer, riseTimer, fallTimer, actionInterval;
var riseInterval, fallInterval, riseTickCounter, fallTickCounter, riseTickReset, fallTickReset;
var doAnimation, player1Score, player2Score, fallOffset, riseOffset, matchAmount;
var minGarbageWidth, garbageTimer, garbageInterval, garbageEnabled;
var pauseMultiplier, paused, pauseTimer, pauseDuration, maxPauseDuration, scoreMultiplier;
var skinSettings, enableParticleEffects, isSinglePlayer, selectorCtx, particleShadowCtx;
var particleInterval, xOffset, guideCtx;

function SkinSettings(){
    this.blockSpriteSize = 32;//16;//
    this.selectorSpriteHeight = 43.2;//21.6;//
    this.selectorSpriteWidth = 72;//36;//
    this.spriteSheetSpriteOffset = 6;//3;//
    this.selectorSpriteSheetSpriteXOffset = 272;//136;//
    this.spriteSheet = "effectsprites";//"oldsprites";//
    this.guideColor = "#FFFFFF";
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
        var temp1 = this.yPos;
        var offSet = temp1 - temp - yFallAmt;
        ctx.clearRect(this.xPos, offSet * blockSize, this.size, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos, this.yPos * blockSize,
            this.size, this.size);
    },
    drawRiseOffset: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos, (this.yPos - riseOffset) * blockSize,
            this.size, this.size);
    },
    drawFallOffset: function () {
        this.determineXY();
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offset = temp1 - temp;
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos, offset * blockSize,
            this.size, this.size);
    },
    determineXY: function () {
        this.pixelsLeft = (this.spriteSize * this.blockType) + (skinSettings.spriteSheetSpriteOffset * (1 + this.blockType));
        this.pixelsTop = skinSettings.spriteSheetSpriteOffset;
    },
    determineColor: function(){
        switch (this.blockType) {
            case 0://Green
                return {
                    highlight: "#01F800",
                    body:"#006800"
                };
            case 1://Purple
                return {
                    highlight: "#F818F8",
                    body:"#4800A0"
                };
            case 2://Red
                return {
                    highlight: "#F81010",
                    body:"#680000"
            };
            case 3://Yellow
                return {
                    highlight: "#F8F800",
                    body:"#605000"
                };
            case 4://Light Blue
                return {
                    highlight: "#01F8F8",
                    body:"#007878"
                };
            case 5://Dark Blue
                return {
                    highlight: "#4070F8",
                    body:"#0000A8"
                };
        }
    },
    calculateXOffset: function () {
        return isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
    }
};

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new BlockSprite({ blockType: blockType, row: row, column: column });
    this.isFalling = false;
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
    this.canvasX = options.column * blockSize + this.calculateXOffset() - 5;
    this.canvasY = (this.yPos * blockSize) - 5;
    this.canvasWidth = blockSize * 2.25;
    this.canvasHeight = blockSize * 1.35;
}

SelectorSprite.prototype = {
    clear: function () {
        selectorCtx.clearRect(this.canvasX, (this.yPos * blockSize) - 5, this.canvasWidth, this.canvasHeight);
    },
    clearOffset: function () {
        this.yPos += (yRiseAmt * riseTickCounter);
        selectorCtx.clearRect(this.canvasX, (this.yPos * blockSize) - 5, this.canvasWidth, this.canvasHeight);
    },
    draw: function () {
        this.determineXY();
        selectorCtx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            this.canvasX, (this.yPos * blockSize) - 5,
            this.canvasWidth, this.canvasHeight);
    },
    drawOffset: function () {
        this.determineXY();
        this.yPos -= (yRiseAmt * riseTickCounter);
        selectorCtx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            this.canvasX, (this.yPos * blockSize) - 5,
            this.canvasWidth, this.canvasHeight);
    },
    determineXY: function () {
        this.pixelsLeft = skinSettings.selectorSpriteSheetSpriteXOffset;
        this.pixelsTop = skinSettings.spriteSheetSpriteOffset;
    },
    calculateXOffset: function () {
        return isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
    }
};

function Selector(coordinates) {
    this.coordinates = coordinates;
    this.coordinates2 = new Coordinates(coordinates.row, coordinates.column + 1);
    this.sprite = new SelectorSprite({ row: coordinates.row, column: coordinates.column });
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
        var temp1 = this.yPos;
        var offSet = temp1 - temp - yFallAmt;
        ctx.clearRect(this.xPos, offSet * blockSize, this.canvasWidth, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos, this.yPos * blockSize,
            this.canvasWidth, this.size);
    },
    drawRiseOffset: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos, (this.yPos - riseOffset) * blockSize,
            this.canvasWidth, this.size);
    },
    drawFallOffset: function () {
        this.determineXY();
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offset = temp1 - temp;
        ctx.drawImage(document.getElementById(skinSettings.spriteSheet),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos, offset * blockSize,
            this.canvasWidth, this.size);
    },
    determineXY: function () {
        var absBlockType = Math.abs(this.blockType);
        this.pixelsLeft = skinSettings.spriteSheetSpriteOffset;
        this.pixelsTop = (this.spriteSize * absBlockType) + (skinSettings.spriteSheetSpriteOffset * (1 + absBlockType));
    },
    calculateXOffset: function () {
        return isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
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

function aniMatrixRising() {
    if (!paused) { riseTickCounter++; }
    riseOffset = yRiseAmt * riseTickCounter;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType === max && r > 0 &&
                (matrix[r - 1][c].blockType === max || 
                    (matrix[r - 1][c].blockType < 0 && !matrix[r - 1][c].isFalling))) {
                block.sprite.clearRiseOffset();
            }
            else if(block.blockType !== max && !block.isFalling){
                block.sprite.clearRiseOffset();
                block.sprite.drawRiseOffset();
                if (block.blockType < 0) {
                    c += block.width - 1;
                }
            }
        }
    }
    if (riseTickCounter === riseTickReset) {
        checkSelectorPosition();
        resetMatrixPosition();
        riseTickCounter = 0;
    }
}

function aniMatrixFalling() {
    fallTickCounter++;
    fallOffset = yFallAmt * fallTickCounter;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType !== max && block.isFalling) {
                block.sprite.clearFallOffset();
                block.sprite.drawFallOffset();
                if(block.blockType < 0){
                    c += block.width - 1;
                }
                if (fallTickCounter === fallTickReset) {
                    if (block.blockType < 0) {
                        switchGarbage(new Coordinates(block.row, block.column),
                            new Coordinates(block.row + 1, block.column));
                    }
                    else {
                        switchBlocks(new Coordinates(block.row, block.column),
                            new Coordinates(block.row + 1, block.column));
                    }
                }
            }
        }
    }
    if (fallTickCounter === fallTickReset) {
        checkAllBlocks();
        fallTickCounter = 0;
    }
}

function animateSelector(coordinates) {
    selector.sprite.clear();
    selector = new Selector(coordinates);
    selector.sprite.drawOffset();
}

function cleanMatrix() {
    var deleteCoordsColumns = cleanColumns();
    var deleteCoordsRows = cleanRows();
    for (var i = 0; i < deleteCoordsColumns.length; i++) {
        deleteBlocks(deleteCoordsColumns[i]);
    }
    for (var j = 0; j < deleteCoordsRows.length; j++) {
        deleteBlocks(deleteCoordsRows[j]);
    }
    $("#p1Score").text(player1Score);
    //$("#p2Score").text(player2Score);
}

function pauseMatrix(now) {
    pauseTimer.tick(now);
    if (pauseTimer.elapsed >= pauseDuration || pauseTimer.elapsed >= maxPauseDuration) {
        var pauseThen = pauseTimer.elapsed % pauseDuration;
        pauseTimer.last = 0;//now - pauseThen;
        pauseDuration = 0;
        paused = false;
    }
    else { paused = true; }
}

function render(now) {
    if (!doAnimation) { ctx = null; return; }
    requestAnimFrame(render);
    riseTimer.tick(now);
    fallTimer.tick(now);
    garbageTimer.tick(now);
    timer.tick(now);
    particleTimer.tick(now);
    if (timer.elapsed >= actionInterval) {
        var actionThen = timer.elapsed % actionInterval;
        timer.last = now - actionThen;
        cleanMatrix();
        selector.sprite.draw();
    }
    if (pauseDuration > 0) {
        pauseMatrix(now);
    }
    if (fallTimer.elapsed >= fallInterval) {
        var cd = fallTimer.elapsed % fallInterval;
        fallTimer.last = now - cd;
        aniMatrixFalling();
    }
    if (garbageEnabled && garbageTimer.elapsed >= garbageInterval) {
        var garbageThen = garbageTimer.elapsed % garbageInterval;
        garbageTimer.last = now - garbageThen;
        if (!paused) { generateGarbage(); }
    }
    if (riseTimer.elapsed >= riseInterval) {
        var then = riseTimer.elapsed % riseInterval;
        riseTimer.last = now - then;
        selector.sprite.clear();
        if (!paused) { selector.sprite.yPos -= yRiseAmt; }
        aniMatrixRising();
        selector.sprite.draw();
    }
    if (particleTimer.elapsed >= particleInterval) {
        var particleThen = particleTimer.elapsed % particleInterval;
        particleTimer.last = now - particleThen;
        for(var i = 0; i < particleArrays.length; i++){
            updateParticlePosition(particleArrays[i]);
            particleArrays[i] = cleanUpArray(particleArrays[i]);
            particleArrays = cleanParticleMatrix();
        }
    }
}

function transformGarbage(coordArray) {
    for (var i = 0; i < coordArray.length; i++) {
        var coord = coordArray[i];
        var newBlock = new Block(coord.row, coord.column, Math.floor(Math.random() * max));
        matrix[coord.row][coord.column] = newBlock;
    }
}

function findGarbageStartRecursively(block) {
    if (block.column === 0 ||
        matrix[block.row][block.column - 1].blockType >= 0 ||
        block.hasOwnProperty('coords')) {
        return new Coordinates(block.row, block.column);
    } else {
        return findGarbageStartRecursively(matrix[block.row][block.column - 1]);
    }
}

function buildArrayFromColumns(row) {
    var coordinatesArray = [];
    for (var c = 0; c < columnCount; c++) {
        coordinatesArray.push(new Coordinates(row, c));
    }
    return coordinatesArray;
}

function buildArrayFromRow(column) {
    var coordinatesArray = [];
    for (var r = 0; r < rowCount; r++) {
        coordinatesArray.push(new Coordinates(r, column));
    }
    return coordinatesArray;
}

function cleanFirstBlockCoords(coordArray) {
    var countArray = [];
    var matchCounter = 1;
    var firstBlock = matrix[coordArray[0].row][coordArray[0].column];
    var block = matrix[coordArray[1].row][coordArray[1].column];
    var nextBlock = matrix[coordArray[2].row][coordArray[2].column];
    if (block.blockType !== max && block.blockType >= 0 &&
        !block.isFalling && !firstBlock.isFalling && !nextBlock.isFalling &&
        block.blockType === firstBlock.blockType && block.blockType === nextBlock.blockType) {
        countArray.push(new Coordinates(firstBlock.row, firstBlock.column));
        countArray.push(new Coordinates(block.row, block.column));
        countArray.push(new Coordinates(nextBlock.row, nextBlock.column));
        matchCounter += 2;
    }
    return { matchCounter: matchCounter, countArray: countArray };
}

function checkFirstBlockForGarbage(coordArray) {
    var block = matrix[coordArray[0].row][coordArray[0].column];
    return (block.blockType < 0) ? block.width : 1;
}

function blocksMatch(block1, block2) {
    if (block1.blockType >= 0 && block1.blockType !== max && !block1.isFalling && !block2.isFalling &&
        block1.blockType === block2.blockType) {
        return true;
    }
    else { return false; }
}

function checkForAdjacentGarbage(coordArray) {
    for (var c = 0; c < coordArray.length; c++) {
        var block = matrix[coordArray[c].row - 1][coordArray[c].column];
        if (block.blockType < 0 && !block.isFalling) {
            return new Coordinates(block.row, block.column);
        }
    }
    return null;
 }

function cleanArray(coordArray, isRow) {
    var deleteArray = [];
    var startCleanObj = cleanFirstBlockCoords(coordArray);
    var countArray = startCleanObj.countArray;
    var matchCounter = startCleanObj.matchCounter;
    var startPoint = isRow ? checkFirstBlockForGarbage(coordArray) : 1;

    for (var i = startPoint; i < coordArray.length - 1; i++) {
        var block = matrix[coordArray[i].row][coordArray[i].column];
        if (isRow && block.blockType < 0) {
            if(!block.hasOwnProperty('coords'))
            {
                var ajsoda = "";
            }
            i += block.width - 1;
            block = matrix[coordArray[i].row][coordArray[i].column];
        }
        var blockCoord = new Coordinates(block.row, block.column);
        var nextBlock = matrix[coordArray[i + 1].row][coordArray[i + 1].column];

        if (blocksMatch(block, nextBlock)) {
            if (i < coordArray.length - 2 &&
                !countArray.includes(blockCoord)) {
                countArray.push(blockCoord);
                matchCounter++;
            }
            else if (i === coordArray.length - 2) {
                countArray.push(blockCoord);
                countArray.push(new Coordinates(nextBlock.row, nextBlock.column));
                matchCounter++;
                if (matchCounter >= matchAmount) {
                    deleteArray = deleteArray.concat(countArray);
                }
            }
        }
        else {
            if (matchCounter >= matchAmount) {
                countArray.push(blockCoord);
                var adjacentGarbage = blockCoord.row === 0 ? null : checkForAdjacentGarbage(countArray);
                if (adjacentGarbage != null) {
                    var garbage = findGarbageStartRecursively(matrix[adjacentGarbage.row][adjacentGarbage.column]);
                    countArray.push(garbage);
                }
                deleteArray = deleteArray.concat(countArray);
                pauseDuration += pauseMultiplier * matchCounter;
            }
            countArray = [];
            matchCounter = 1;
        }
    }
    return deleteArray;
}

function deleteBlocks(matchingBlocks) {
    for (var j = 0; j < matchingBlocks.length; j++) {
        var blockCoord = matchingBlocks[j];
        var block = matrix[blockCoord.row][blockCoord.column];
        if (block.blockType < 0) {
            transformGarbage(block.coords);
            j += block.width - 1;
        }
        else if (block.blockType !== max &&
            block.blockType >= 0) {
            player1Score += scoreMultiplier;
            block.blockType = max;
            block.sprite.clear();
            if(enableParticleEffects){
                var newParticles = generateCoordinateParticles(block.sprite.xPos, block.row * blockSize, block.sprite.determineColor());
                particleArrays.push(newParticles);
            }
        }
    }
}

function cleanColumns() {
    var deleteCoords = [];
    for (var c = 0; c < columnCount; c++) {
        var columnArray = buildArrayFromRow(c);
        var cleanedRowCoords = cleanArray(columnArray, false);
        deleteCoords.push(cleanedRowCoords);
    }
    return deleteCoords;
}

function cleanRows() {
    var deleteCoords = [];
    for (var r = 0; r < rowCount; r++) {
        var rowCoordArray = buildArrayFromColumns(r);
        var cleanedColumnCoords = cleanArray(rowCoordArray, true);
        deleteCoords.push(cleanedColumnCoords);
    }
    return deleteCoords;
}

function revertGarbage(coords, falling){
    coords.forEach(function (coord) {
        matrix[coord.row][coord.column].isFalling = falling;
    });
}

function checkGarbage(garbage) {
    if (garbage.row === rowCount - 1) {
        garbage.isFalling = false;
        return;
    }
    else {
        if(!garbage.hasOwnProperty('coords'))
        {
            var ajsoda = "";
        }
        for (i = 0; i < garbage.coords.length; i++) {
            var coord = garbage.coords[i];
            matrix[coord.row][coord.column].isFalling = true;
            if (matrix[coord.row + 1][coord.column].blockType !== max) {
                revertGarbage(garbage.coords.slice(0, i + 1), false);
                return;
            }
        }
    }
 }

function checkBlock(block) {
    if (block.row === rowCount - 1 || matrix[block.row + 1][block.column].blockType !== max) {
        block.isFalling = false;
        return;
    }
    else {
        block.isFalling = true;
    }
}

function checkAllBlocks() {
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType < 0) {
                checkGarbage(block);
                c += block.width - 1;
            } else {
                checkBlock(block);
            }
        }
    }
}

function switchBlocks(block1Coords, block2Coords) {
    var block1 = matrix[block1Coords.row][block1Coords.column];
    var block2 = matrix[block2Coords.row][block2Coords.column];

    matrix[block1.row][block1.column] = new Block(block1.row, block1.column, block2.blockType);
    matrix[block2.row][block2.column] = new Block(block2.row, block2.column, block1.blockType);
}

function switchGarbage(garbageCoords, blockCoords) {
    var garbage = matrix[garbageCoords.row][garbageCoords.column];
    var newGarbage = new Garbage(blockCoords.row, blockCoords.column, garbage.width, garbage.blockType);

    for (var c = 0; c < garbage.width; c++) {
        var coord = garbage.coords[c];
        var blockType = matrix[blockCoords.row][blockCoords.column + c].blockType;
        matrix[coord.row][coord.column] = new Block(coord.row, coord.column, blockType);//empty block
        matrix[coord.row][coord.column].isFalling = true;
        matrix[blockCoords.row][coord.column] = new Block(blockCoords.row, coord.column, newGarbage.blockType);//garbage block
    }

    matrix[blockCoords.row][blockCoords.column] = newGarbage;
}

function topCollisionDetected() {
    for (var c = 0; c < columnCount; c++) {
        if (matrix[1][c].blockType !== max &&
            !matrix[1][c].isFalling) {
            return true;
        }
    }
    return false;
}

function raiseBlocksUpLogically() {
    for (var r = 1; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType < 0) {
                switchGarbage(new Coordinates(block.row, block.column),
                    new Coordinates(block.row - 1, block.column));
                c += block.width - 1;
            }
            else if (block.blockType !== max) {
                switchBlocks(new Coordinates(block.row, block.column),
                    new Coordinates(block.row - 1, block.column));
            }
        }
    }
}

function generateRow() {
    var row = [];
    for (var c = 0; c < columnCount; c++) {
        var newBlock = new Block(rowCount - 1, c, Math.floor(Math.random() * max));
        newBlock.isOffscreen = true;
        row.push(newBlock);
    }
    return row;
}

function generateGarbage() {
    var garbageWidth = Math.floor(Math.random() * minGarbageWidth) + minGarbageWidth;
    var startColumn = Math.floor(Math.random() * (columnCount - garbageWidth));
    var garbage = new Garbage(0, startColumn, garbageWidth, -(garbageWidth - 2));
    garbage.isFalling = true;
    garbage.buildGarbage(true);
}

function resetBlockPositions() {
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (r === rowCount - 2) { block.isOffscreen = false; }
            if (block.blockType !== max || block.hasOwnProperty('coords')) {
                block.sprite.clear();
            }
            //block.sprite.yPos = block.row - 1;
            if (block.blockType !== max || block.hasOwnProperty('coords')) {
                block.sprite.draw();
            }
        }
    }
}

function resetMatrixPosition() {
    if (!topCollisionDetected()) {
        raiseBlocksUpLogically();
        matrix[rowCount - 1] = generateRow();
        resetBlockPositions();
    }
    else {
        stop();
    }
}

function compareBlockToSelector(block) {
    if (block.row === selector.coordinates.row && block.column === selector.coordinates.column ||
        block.row === selector.coordinates2.row && block.column === selector.coordinates2.column) {
        return true;
    } else {
        return false;
    }
}

function checkSelectorPosition() {
    if (selector.coordinates.row > 0) {
        selector.coordinates.row--;
        selector.coordinates2.row--;
    }
}

function initializeMatrix(rows, columns) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var r = 0; r < rows - 1; r++) {
        initialMatrix[r] = [];
        for (var c = 0; c < columns; c++) {
            var newBlock;
            if (r < Math.round(rows / 1.5)) {
                newBlock = new Block(r, c, max);
            }
            else {
                newBlock = new Block(r, c, Math.floor(Math.random() * (max + 1)));
            }
            initialMatrix[r][c] = newBlock;
            if (newBlock.blockType !== max) {
                newBlock.sprite.draw();
            }
        }
    }
    initialMatrix[rows - 1] = generateRow();
    return initialMatrix;
}

function createCanvas() {
    var guideCanvas = document.getElementById("guides");
    guideCanvas.width = guideCanvas.clientWidth;
    guideCanvas.height = guideCanvas.clientHeight;
    guideCtx = guideCanvas.getContext("2d");

    var canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");

    var particleCanvas = document.getElementById("particles");
    particleCanvas.width = particleCanvas.clientWidth;
    particleCanvas.height = particleCanvas.clientHeight;
    particleCtx = particleCanvas.getContext("2d");

    var selectorCanvas = document.getElementById("selector");
    selectorCanvas.width = selectorCanvas.clientWidth;
    selectorCanvas.height = selectorCanvas.clientHeight;
    selectorCtx = selectorCanvas.getContext("2d");

    var shadowCanvas = document.getElementById("particleshadows");
    shadowCanvas.width = shadowCanvas.clientWidth;
    shadowCanvas.height = shadowCanvas.clientHeight;
    particleShadowCtx = shadowCanvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    blockSize = canvas.clientHeight / (rowCount - 2);
}

function dropBlockDownRecursively(block) {
    if (block.row === rowCount - 1 || matrix[block.row + 1][block.column].blockType !== max) {
        return;
    }
    else {
        switchBlocks(new Coordinates(block.row, block.column),
            new Coordinates(block.row + 1, block.column));
        dropBlockDownRecursively(matrix[block.row + 1][block.column]);

        matrix[block.row][block.column].sprite.clear();
        if (matrix[block.row + 1][block.column].blockType !== max) {
            matrix[block.row + 1][block.column].sprite.draw();
        }
    }
}

function dropBlocksInRow(row) {
    for (var c = 0; c < columnCount; c++) {
        var block = matrix[row][c];
        var lowerblock = matrix[row + 1][c];
        if (lowerblock.blockType === max
            && block.blockType !== max) {
            dropBlockDownRecursively(block);
        }
    }
}

function dropAllBlocks() {
    for (var r = rowCount - 2; r >= 0; r--) {
        dropBlocksInRow(r);
    }
}

function hideSettings() {
    $("#settingsScreen").hide();
    $("#mainScreen").show();
}

function showSettings() {
    $("#mainScreen").hide();
    $("#settingsScreen").show();
    hideScores();
}

function hideScores(){
    $("#p1Score").hide();
    $("#p2Score").hide();    
}

function showScores(){
    $("#p1Score").show();
    if(!isSinglePlayer){ $("#p2Score").show(); } 
}

function pause() { paused = paused ? false : true; }
function stop() {
    $("#gameOver").show();
    doAnimation = false;
}

function restart() {
    player1Score = 0;
    player2Score = 0;
    start();
    $("#gameOver").hide();
}

function quit() {
    $("#game").hide();
    hideScores();
    $("#gameOver").hide();
    $("#mainScreen").show();
}

function drawGuides(){
    var guideWidth = 2;
    var shadowSize = 30;
    var leftGuideX = xOffset - guideWidth - 1;
    var rightGuideX = columnCount * blockSize + xOffset  + guideWidth + 1;
    var bottomGuideY = canvasHeight + 1;

    guideCtx.beginPath();
    guideCtx.moveTo(leftGuideX, 15);
    guideCtx.lineWidth = guideWidth;
    guideCtx.shadowColor = skinSettings.guideColor;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.shadowBlur = shadowSize;
    guideCtx.lineTo(leftGuideX, bottomGuideY);
    guideCtx.stroke();

    guideCtx.beginPath();    
    guideCtx.moveTo(rightGuideX, 15);
    guideCtx.lineWidth = guideWidth;
    guideCtx.shadowColor = skinSettings.guideColor;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.shadowBlur = shadowSize;
    guideCtx.lineTo(rightGuideX, bottomGuideY);
    guideCtx.stroke();

    guideCtx.beginPath();
    guideCtx.moveTo(leftGuideX, bottomGuideY);
    guideCtx.lineWidth = guideWidth;
    guideCtx.shadowColor = skinSettings.guideColor;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.shadowBlur = shadowSize;
    guideCtx.lineTo(rightGuideX, bottomGuideY);
    guideCtx.stroke();
}

function start() {
    $("#mainScreen").hide();
    moveScoreLocation();
    showScores();
    $("#game").show();
    createCanvas();
    xOffset = isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
    doAnimation = true;
    matrix = initializeMatrix(rowCount, columnCount);
    selector = new Selector(new Coordinates(rowCount / 2, columnCount / 3)); 
    cleanColumns();
    dropAllBlocks();
    cleanRows();
    dropAllBlocks();
    resetMatrixPosition();
    drawGuides();
    selector.sprite.draw();
    requestAnimFrame(render);
}

function getRadioValue(radioName) {
    var radios = document.getElementsByName(radioName);

    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

function moveScoreLocation(){
    if(isSinglePlayer){
        $("#p1Score").animate({ left: '230px' });
        $("#p2Score").hide();
    }
    else{
        $("#p1Score").animate({ top: '230px' });
        $("#p2Score").show();
    }
}

function buildSettings() {
    $("#settingsScreen").hide();
    hideScores();
    garbageEnabled = document.getElementById('garbageEnable').checked;
    var val = getRadioValue('speedRadio');
    xMoveAmt = .2;
    yFallAmt = .2;
    yRiseAmt = .01;
    if (val === "1") {
        yRiseAmt = .0025;
    }
    else if (val === "3") {
        yRiseAmt = .025;
    }
    riseInterval = 1000 / 60;
    particleInterval = 1000 / 60;
    actionInterval = 1000 / 2;
    fallInterval = 1000 / 50;
    garbageInterval = document.getElementById('intervalInputId').value * 1000;
    pauseMultiplier = document.getElementById('multiplierInputId').value * 1000;
    maxPauseDuration = pauseMultiplier * 10;
    matchAmount = getRadioValue('matchRadio');
    fallTickReset = 1 / yFallAmt;
    riseTickReset = 1 / yRiseAmt;
    skinSettings = new SkinSettings();
    isSinglePlayer = document.getElementById('singlePlayer').checked;
    $("#mainScreen").show();
}

$(document).ready(function () {
    riseTimer = new Timer();
    fallTimer = new Timer();
    garbageTimer = new Timer();
    timer = new Timer();
    pauseTimer = new Timer();
    particleTimer = new Timer();
    rowCount = 12 + 2;
    columnCount = 6;
    minGarbageWidth = columnCount / 2;
    max = 6;

    fallTickCounter = 0;
    riseTickCounter = 0;
    player1Score = 0;
    player2Score = 0;
    fallOffset = 0;
    riseOffset = 0;
    pauseDuration = 0;
    scoreMultiplier = 1;
    doAnimation = false;
    enableParticleEffects = true;
    $('#guides').height($('#guides').height() + 20);
    buildSettings();
});

$(document).on('keydown', function (event) {
    var code = event.keyCode || event.which;
    if (!doAnimation && code === 13) { start(); }
    else if (doAnimation) {
        switch (code) {
            case 32://Space
                if (matrix[selector.coordinates.row][selector.coordinates.column].blockType >= 0 &&
                    matrix[selector.coordinates2.row][selector.coordinates2.column].blockType >= 0) {
                    switchBlocks(selector.coordinates, selector.coordinates2);
                    animateSelector(selector.coordinates);
                }
                break;
            case 37://Left
                if (selector.coordinates.column > 0) {
                    animateSelector(new Coordinates(selector.coordinates.row,
                        selector.coordinates.column - 1));
                }
                break;
            case 38://Up
                if (selector.coordinates.row > 0) {
                    animateSelector(new Coordinates(selector.coordinates.row - 1,
                        selector.coordinates.column));
                }
                break;
            case 39://Right
                if (selector.coordinates.column < columnCount - 2) {
                    animateSelector(new Coordinates(selector.coordinates.row,
                        selector.coordinates.column + 1));
                }
                break;
            case 40://Down
                if (selector.coordinates.row < rowCount - 2) {
                    animateSelector(new Coordinates(selector.coordinates.row + 1,
                        selector.coordinates.column));
                }
                break;
            case 90://Z
                pause();
                break;
        }
    }
});

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();