var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yRiseAmt, yFallAmt, constMoveAmt, timer, riseTimer, fallTimer, actionInterval;
var riseInterval, fallInterval, riseTickCounter, fallTickCounter, riseTickReset, fallTickReset;
var doAnimation, player1Score, player2Score, fallOffset, riseOffset, matchAmount;
var minGarbageWidth, garbageTimer, garbageInterval, paused, pauseTimer, pauseDuration;
var pauseMultiplier, maxPauseDuration;

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
        this.last = this.last || now
        this.elapsed = now - this.last
    }
}

function BlockSprite(options) {
    this.size = blockSize;
    this.spriteSize = 16;
    this.blockType = options.blockType;
    this.row = options.row;
    this.column = options.column;
    this.xPos = options.column;
    this.yPos = options.row + 1;
}

BlockSprite.prototype = {
    clear: function () {
        ctx.clearRect(this.xPos * blockSize, this.yPos * blockSize, this.size, this.size);
    },
    clearRiseOffset: function () {
        var offSet = riseOffset;
        ctx.clearRect(this.xPos * blockSize, (this.yPos - offSet) * blockSize, this.size, this.size);
    },
    clearFallOffset: function () {
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offSet = temp1 - temp - yFallAmt;
        ctx.clearRect(this.xPos * blockSize, offSet * blockSize, this.size, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos * blockSize, this.yPos * blockSize,
            this.size, this.size);
    },
    drawRiseOffset: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos * blockSize, (this.yPos - riseOffset) * blockSize,
            this.size, this.size);
    },
    drawFallOffset: function () {
        this.determineXY();
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offset = temp1 - temp;
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos * blockSize, offset * blockSize,
            this.size, this.size);
    },
    determineXY: function () {
        this.pixelsLeft = (this.spriteSize * this.blockType) + (3 * (1 + this.blockType));
        this.pixelsTop = 3;
    }
}

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
    this.yPos = options.row + 1;
    this.spriteWidth = 36;
    this.spriteHeight = 21.6;
    this.canvasX = (this.xPos * blockSize) - 10;
    this.canvasY = (this.yPos * blockSize) - 10;
    this.canvasWidth = blockSize * 2.25;
    this.canvasHeight = blockSize * 1.35;
}

SelectorSprite.prototype = {
    clear: function () {
        ctx.clearRect((this.xPos * blockSize) - 10, (this.yPos * blockSize) - 10, this.canvasWidth, this.canvasHeight);
    },
    clearOffset: function () {
        this.yPos += (yRiseAmt * riseTickCounter);
        ctx.clearRect((this.xPos * blockSize) - 10, (this.yPos * blockSize) - 10, this.canvasWidth, this.canvasHeight);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            (this.xPos * blockSize) - 10, (this.yPos * blockSize) - 10,
            this.canvasWidth, this.canvasHeight);
    },
    drawOffset: function () {
        this.determineXY();
        this.yPos -= (yRiseAmt * riseTickCounter);
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            (this.xPos * blockSize) - 10, (this.yPos * blockSize) - 10,
            this.canvasWidth, this.canvasHeight);
    },
    determineXY: function () {
        this.pixelsLeft = 136;
        this.pixelsTop = 3;
    }
}

function Selector(coordinates) {
    this.coordinates = coordinates;
    this.coordinates2 = new Coordinates(coordinates.row, coordinates.column + 1);
    this.sprite = new SelectorSprite({ row: coordinates.row, column: coordinates.column });
}

function GarbageSprite(options) {
    this.size = blockSize;
    this.spriteSize = 16;
    this.blockType = options.blockType;
    this.row = options.row;
    this.spriteWidth = this.spriteSize * options.width;
    this.canvasWidth = blockSize * options.width
    this.xPos = options.column;
    this.yPos = options.row + 1;
}

GarbageSprite.prototype = {
    clear: function () {
        ctx.clearRect(this.xPos * blockSize, this.yPos * blockSize, this.canvasWidth, this.size);
    },
    clearRiseOffset: function () {
        var offSet = riseOffset;
        ctx.clearRect(this.xPos * blockSize, (this.yPos - offSet) * blockSize, this.canvasWidth, this.size);
    },
    clearFallOffset: function () {
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offSet = temp1 - temp - yFallAmt;
        ctx.clearRect(this.xPos * blockSize, offSet * blockSize, this.canvasWidth, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos * blockSize, this.yPos * blockSize,
            this.canvasWidth, this.size);
    },
    drawRiseOffset: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos * blockSize, (this.yPos - riseOffset) * blockSize,
            this.canvasWidth, this.size);
    },
    drawFallOffset: function () {
        this.determineXY();
        var temp = riseOffset - fallOffset;
        var temp1 = this.yPos;
        var offset = temp1 - temp;
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteSize,
            this.xPos * blockSize, offset * blockSize,
            this.canvasWidth, this.size);
    },
    determineXY: function () {
        var absBlockType = Math.abs(this.blockType);
        this.pixelsLeft = 3;
        this.pixelsTop = (this.spriteSize * absBlockType) + (3 * (1 + absBlockType));
    }
}

function Garbage(row, startColumn, width, blockType) {
    this.blockType = blockType;
    this.coords = buildGarbageCoords(row, startColumn, width, blockType);
    this.row = row;
    this.column = startColumn;
    this.width = width;
    this.sprite = new GarbageSprite({ blockType: blockType, row: row, column: startColumn, width: width });
    this.isFalling = false;
    this.isOffscreen = false;
    this.isSelected = false;
}

Garbage.prototype = {
    buildGarbage: function (falling) {
        matrix[this.row][this.column] = this;
        for (var c = 1; c < this.coords.length; c++) {
            var coord = this.coords[c];
            matrix[coord.row][coord.column].blockType = this.blockType;
            matrix[coord.row][coord.column].isFalling = falling;
        }
    }
}

function buildGarbageCoords(row, startColumn, garbageWidth, blockType) {
    var coordinatesArray = [];
    for (var c = 0; c < garbageWidth; c++) {
        coordinatesArray.push(new Coordinates(row, startColumn + c));
    }
    return coordinatesArray;
}

function aniMatrixRising() {
    if (!paused) { riseTickCounter++; }
    riseOffset = yRiseAmt * riseTickCounter;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType === max && r > 0 &&
                matrix[r - 1][c].blockType === max) {
                block.sprite.clearRiseOffset();
            }
            else if (block.blockType < 0 && !block.isFalling &&
                block.blockType !== max) {
                block.sprite.clearRiseOffset();
                block.sprite.drawRiseOffset();
                c += block.width - 1;
            }
            else if (!block.isFalling &&
                block.blockType !== max) {
                //block.sprite.clearRiseOffset();
                block.sprite.drawRiseOffset();
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
                if (fallTickCounter === fallTickReset) {
                    if (block.blockType < 0) {
                        switchGarbage(new Coordinates(block.row, block.column),
                            new Coordinates(block.row + 1, block.column));
                        c += block.width - 1;
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
    var block = matrix[selector.coordinates.row][selector.coordinates.column];
    var block2 = matrix[selector.coordinates.row][selector.coordinates.column + 1];
    selector.sprite.clear();
    if (riseTickCounter !== 0) {
        if (block.blockType !== max) {
            block.sprite.drawRiseOffset();
        }
        if (block2.blockType !== max) {
            block2.sprite.drawRiseOffset();
        }
    }
    else {
        if (block.blockType !== max) {
            block.sprite.draw();
        }
        if (block2.blockType !== max) {
            block2.sprite.draw();
        }
    }

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
    if (garbageTimer.elapsed >= garbageInterval) {
        var garbageThen = garbageTimer.elapsed % garbageInterval;
        garbageTimer.last = 0;//now - garbageThen;
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
    if (block1.blockType !== max && !block1.isFalling && !block2.isFalling &&
        block1.blockType === block2.blockType) {
        return true;
    }
    else { return false; }
}

function cleanArray(coordArray, isRow) {
    var deleteArray = [];
    var startCleanObj = cleanFirstBlockCoords(coordArray)
    var countArray = startCleanObj.countArray;
    var matchCounter = startCleanObj.matchCounter;
    var startPoint = isRow ? checkFirstBlockForGarbage(coordArray) : 1;

    for (var i = startPoint; i < coordArray.length - 1; i++) {
        var block = matrix[coordArray[i].row][coordArray[i].column];
        if (isRow && block.blockType < 0) {
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
                if (!isRow && matrix[countArray[0].row - 1][countArray[0].column].blockType < 0) {
                    var garbage = findGarbageStartRecursively(matrix[countArray[0].row - 1][countArray[0].column]);
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
        if (block.blockType < 0 &&
            block.coords != null) {
            transformGarbage(block.coords);
        }
        else if (block.blockType !== max) {
            player1Score++;
            block.blockType = max;
            block.sprite.clear();
        }
    }
}

function cleanColumns() {
    var deleteCoords = []
    for (var c = 0; c < columnCount; c++) {
        var columnArray = buildArrayFromRow(c);
        var cleanedRowCoords = cleanArray(columnArray, false);
        deleteCoords.push(cleanedRowCoords);
    }
    return deleteCoords;
}

function cleanRows() {
    var deleteCoords = []
    for (var r = 0; r < rowCount; r++) {
        var rowCoordArray = buildArrayFromColumns(r);
        var cleanedColumnCoords = cleanArray(rowCoordArray, true);
        deleteCoords.push(cleanedColumnCoords);
    }
    return deleteCoords;
}

function checkGarbage(garbage) {
    if (garbage.row === rowCount - 1) {
        garbage.isFalling = false;
        return;
    }
    else {
        for (var i = 0; i < garbage.coords.length; i++) {
            if (matrix[garbage.coords[i].row + 1][garbage.coords[i].column].blockType !== max) {
                garbage.isFalling = false;
                return;
            }
        }
        garbage.isFalling = true;
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

        if (blockType < 0) {
            var otherGarbage = new Garbage(coord.row, coord.column, garbage.width, blockType);
            otherGarbage.buildGarbage(false);
            break;
        } else {
            matrix[coord.row][coord.column] = new Block(coord.row, coord.column, blockType);
        }
    }

    newGarbage.buildGarbage(false);
}

function topCollisionDetected() {
    for (var c = 0; c < columnCount; c++) {
        if (matrix[0][c].blockType !== max &&
            !matrix[0][c].isFalling) {
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
    var row = []
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
            if (r === rowCount - 1) { block.isOffscreen = false; }
            if (block.blockType !== max) {
                block.sprite.clear();
                block.sprite.yPos = block.row + 1;
                block.sprite.draw();
            }
            if (block.blockType < 0) { c += block.width - 1; }
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
            if (r < rows / 2) {
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
    var canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    blockSize = canvas.clientHeight / rowCount;
    matrix = initializeMatrix(rowCount, columnCount);
    selector = new Selector(new Coordinates(rowCount / 2, columnCount / 3));
    requestAnimFrame(render);
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

function pause() { paused = paused ? false : true; }
function stop() { doAnimation = false; }
function start() {
    var canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");
    doAnimation = true;
    requestAnimFrame(render);
}

$(document).ready(function () {
    riseTimer = new Timer();
    fallTimer = new Timer();
    garbageTimer = new Timer();
    timer = new Timer();
    pauseTimer = new Timer();
    rowCount = 12;
    columnCount = 6;
    max = 6;
    xMoveAmt = .2;
    yFallAmt = .2;
    yRiseAmt = .01;
    riseInterval = 1000 / 60;
    actionInterval = 1000 / 2;
    fallInterval = 1000 / 50;
    garbageInterval = 5000;
    pauseDuration = 0;
    pauseMultiplier = 1000;
    maxPauseDuration = pauseMultiplier * 10;
    fallTickCounter = 0;
    riseTickCounter = 0;
    doAnimation = true;
    player1Score = 0;
    player2Score = 0;
    fallOffset = 0;
    riseOffset = 0;
    matchAmount = 3;
    minGarbageWidth = columnCount / 2;
    riseTickReset = 1 / yRiseAmt;
    fallTickReset = 1 / yFallAmt;
    paused = false;
});

$(window).on('load', function () {
    createCanvas();
    cleanColumns();
    dropAllBlocks();
    cleanRows();
    dropAllBlocks();
    player1Score = 0;
    resetMatrixPosition();
    selector.sprite.draw();
});

$(document).on('keydown', function (event) {
    var code = event.keyCode || event.which;
    switch (code) {
        case 32:
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
});

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();