var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yMoveAmt, constMoveAmt, timer, riseTimer, fallTimer, actionInterval;
var riseInterval, fallInterval, riseTickCounter, fallTickCounter, doAnimation;

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
    this.interval = 1000 / options.fps;
    this.row = options.row;
    this.column = options.column;
    this.now = new Date().getTime();
    this.xPos = options.row+1;
    this.yPos = options.column;
}

BlockSprite.prototype = {
    clear: function () {
        ctx.clearRect(this.yPos * blockSize, this.xPos * blockSize, this.size, this.size);
    },
    clearOffset: function(){
        this.xPos += (xMoveAmt * riseTickCounter);
        ctx.clearRect(this.yPos * blockSize, this.xPos * blockSize, this.size, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.yPos * blockSize, this.xPos * blockSize,
            this.size, this.size);
    },
    drawOffset: function () {
        this.determineXY();
        this.xPos -= (xMoveAmt * riseTickCounter);
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.yPos * blockSize, this.xPos * blockSize,
            this.size, this.size);
    },
    determineXY: function () {
        this.pixelsLeft = (this.spriteSize * this.blockType) + (3 * (1 + this.blockType));
        this.pixelsTop = 3;
    }
}

function SelectorSprite(options) {
    this.row = options.row;
    this.column = options.column;
    this.now = new Date().getTime();
    this.xPos = options.row + 1;
    this.yPos = options.column;
    this.spriteWidth = 36;
    this.spriteHeight = 21.6;
    this.canvasX = (this.yPos * blockSize) - 10;
    this.canvasY = (this.xPos * blockSize) - 10;
    this.canvasWidth = blockSize * 2.25;
    this.canvasHeight = blockSize * 1.35;
}

SelectorSprite.prototype = {
    clear: function () {
        ctx.clearRect((this.yPos * blockSize) - 10, (this.xPos * blockSize) - 10, this.canvasWidth, this.canvasHeight);
    },
    clearOffset: function () {
        this.xPos += (xMoveAmt * riseTickCounter);
        ctx.clearRect((this.yPos * blockSize) - 10, (this.xPos * blockSize) - 10, this.canvasWidth, this.canvasHeight);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            (this.yPos * blockSize) - 10, (this.xPos * blockSize) - 10,
            this.canvasWidth, this.canvasHeight);
    },
    drawOffset: function () {
        this.determineXY();
        this.xPos -= (xMoveAmt * riseTickCounter);
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteWidth, this.spriteHeight,
            (this.yPos * blockSize) - 10, (this.xPos * blockSize) - 10,
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
    this.sprite = new SelectorSprite({ row: coordinates.row, column: coordinates.column});
}

function Coordinates(row, column) {
    this.row = row;
    this.column = column;
}

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new BlockSprite({ blockType: blockType, row: row, column: column, fps: 4 });
    this.isFalling = false;
    this.isOffscreen = false;
    this.isSelected = false;
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
    requestAnimationFrame(render);
}

function aniMatrixRising() {
    riseTickCounter++;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType !== max && !block.isFalling
                && !block.isSelected) {
                block.sprite.clear();
                block.sprite.xPos -= xMoveAmt;
                block.sprite.draw();
            }
        }
    }
    if (riseTickCounter === 5) {
        checkMatrixPosition();
        riseTickCounter = 0;
    }
}

function aniMatrixFalling() {
    fallTickCounter++;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType !== max && block.isFalling) {
                block.sprite.clear();
                block.sprite.xPos += xMoveAmt;
                block.sprite.draw();
                if (fallTickCounter === 5) {
                    switchBlocks(new Coordinates(block.row, block.column),
                        new Coordinates(block.row + 1, block.column));
                }
            }
        }
    }
    if (fallTickCounter === 5) {
        checkAllBlocks();
        fallTickCounter = 0;
    }
}

function animateSelector(coordinates) {
    var block = matrix[selector.coordinates.row][selector.coordinates.column];
    var block2 = matrix[selector.coordinates.row][selector.coordinates.column + 1];
    selector.sprite.clear();
    if (block.blockType !== max) {
        block.sprite.draw();
    }
    if (block2.blockType !== max) {
        block2.sprite.draw();
    }

    selector = new Selector(coordinates);
    selector.sprite.drawOffset();
}

function cleanMatrix() {
    cleanColumns();
    cleanRows();
    checkAllBlocks();
}

function render(now) {
    if (!doAnimation) { ctx = null; return; }
    requestAnimationFrame(render);
    riseTimer.tick(now);
    fallTimer.tick(now);
    timer.tick(now);
    if (timer.elapsed >= actionInterval) {
        var actionThen = timer.elapsed % actionInterval;
        timer.last = now - actionThen;
        cleanMatrix();
    }
    //if (fallTimer.elapsed >= fallInterval) {
        //var cd = fallTimer.elapsed % fallInterval;
        //fallTimer.last = now - cd;
        aniMatrixFalling();
    //}
    if (riseTimer.elapsed >= riseInterval) {
        var then = riseTimer.elapsed % riseInterval;
        riseTimer.last = now - then;
        selector.sprite.clear();
        selector.sprite.xPos -= xMoveAmt;
        aniMatrixRising();
        selector.sprite.draw();
    }
}

function initializeMatrix(rows, columns) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var r = 0; r < rows-1; r++) {
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
    initialMatrix[rows-1] = generateRow();
    return initialMatrix;
}

function buildArrayFromColumns(row) {
    var coordinatesArray = [];
    for (var i = 0; i <= columnCount; i++) {
        coordinatesArray.push(new Coordinates(row, i));
    }
    return coordinatesArray;
}

function buildArrayFromRow(column) {
    var coordinatesArray = [];
    for (var i = 0; i < rowCount; i++) {
        coordinatesArray.push(new Coordinates(i, column));
    }
    return coordinatesArray;
}

function cleanArray(coordArray) {
    var deleteArray = [];
    for (var i = 1; i < coordArray.length - 1; i++) {
        var block = matrix[coordArray[i].row][coordArray[i].column];
        var prevBlock = matrix[coordArray[i - 1].row][coordArray[i - 1].column];
        if (block.blockType === prevBlock.blockType && !block.isFalling && !prevBlock.isFalling) {
            deleteArray.push(new Coordinates(block.row, block.column));
            deleteArray.push(new Coordinates(prevBlock.row, prevBlock.column));
        }
    }
    return deleteArray;
}

function deleteBlocks(matchingBlocks) {
    for (var j = 0; j < matchingBlocks.length; j++) {
        var blockCoord = matchingBlocks[j];
        matrix[blockCoord.row][blockCoord.column].blockType = max;
        matrix[blockCoord.row][blockCoord.column].sprite.clearOffset();
    }
}

function cleanColumns() {
    for (var c = 0; c < columnCount; c++) {
        var columnArray = buildArrayFromRow(c);
        var cleanedRowCoords = cleanArray(columnArray);
        deleteBlocks(cleanedRowCoords);
    }
}

function cleanRows() {
    for (var r = 0; r < rowCount; r++) {
        var rowCoordArray = buildArrayFromColumns(r);
        var cleanedColumnCoords = cleanArray(rowCoordArray);
        deleteBlocks(cleanedColumnCoords);
    }
}

function checkAllBlocks() {
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            checkBlock(matrix[r][c]);
        }
    }
}

function switchBlocks(block1Coords, block2Coords) {
    var block = matrix[block1Coords.row][block1Coords.column];
    var lowerBlock = matrix[block2Coords.row][block2Coords.column];

    matrix[block.row][block.column] = new Block(block.row, block.column, lowerBlock.blockType);
    matrix[lowerBlock.row][lowerBlock.column] = new Block(lowerBlock.row, lowerBlock.column, block.blockType);
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

function topCollisionDetected() {
    for (var c = 0; c < columnCount; c++) {
        if (matrix[0][c].blockType !== max) {
            return true;
        }
    }
    return false;
}

function raiseBlocksUpLogically() {
    for (var r = 1; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            switchBlocks(new Coordinates(block.row, block.column),
            new Coordinates(block.row - 1, block.column));
        }
    }
}

function generateRow() {
    var row = []
    for (var c = 0; c < columnCount; c++) {
        var newBlock = new Block(rowCount - 1, c, Math.floor(Math.random() * (max)));
        newBlock.isOffscreen = true;
        row.push(newBlock);
    }
    return row;
}

function resetBlockPositions() {    
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            if (r === rowCount - 1) { matrix[r][c].isOffscreen = false; }
            if (matrix[r][c].blockType !== max) {
                matrix[r][c].sprite.clear();
                matrix[r][c].sprite.xPos = matrix[r][c].row + 1;
                matrix[r][c].sprite.draw();
            }
            if (compareBlockToSelector(matrix[r][c])) {
                selector.sprite.draw();
            }
        }
    }
}

function compareBlockToSelector(block) {
    if(block.row ===selector.coordinates.row && block.column === selector.coordinates.column ||
        block.row === selector.coordinates2.row && block.column === selector.coordinates2.column) {
        return true;
    } else {
        return false;
    }
}

function checkMatrixPosition() {
    if (!topCollisionDetected()) {
        raiseBlocksUpLogically();
        selector.coordinates.row--;
        selector.coordinates2.row--;
        selector.sprite.draw();
        matrix[rowCount-1] = generateRow();
        resetBlockPositions();
    }
    else {
        stop();
    }
}

function pause() { }
function stop() { doAnimation = false; }
function start() {
    var canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");
    doAnimation = true;
    requestAnimationFrame(render);
}

$(document).ready(function () {
    riseTimer = new Timer();
    fallTimer = new Timer();
    timer = new Timer();
    rowCount = 12;
    columnCount = 6;
    max = 6;
    xMoveAmt = .2;
    yMoveAmt = .2;
    riseInterval = 1000 / 1;
    actionInterval = 1000 / 60;
    fallInterval = 1000 / 2;
    fallTickCounter = 0;
    riseTickCounter = 0;
    doAnimation = true;
    //logCurrentMatrixState();
});

$(window).load(function () {
    createCanvas();
    cleanColumns();
    dropAllBlocks();
    cleanRows();
    dropAllBlocks();
    checkMatrixPosition();
    selector.sprite.draw();
    //logCurrentMatrixState();
});

$(document).keydown(function (event) {
    var code = event.keyCode || event.which;
    switch (code) {
        case 32:
            switchBlocks(selector.coordinates, selector.coordinates2);
            break;
        case 37://Left
            animateSelector(new Coordinates(selector.coordinates.row,
                selector.coordinates.column - 1));
            break;
        case 38://Up
            animateSelector(new Coordinates(selector.coordinates.row - 1,
                selector.coordinates.column));
            break;
        case 39://Right
            animateSelector(new Coordinates(selector.coordinates.row,
                selector.coordinates.column + 1));
            break;
        case 40://Down
            animateSelector(new Coordinates(selector.coordinates.row + 1,
                selector.coordinates.column));
            break;
    }
});

/*
function logCurrentMatrixState() {
    var matrixAsString;
    for (var i = 0; i < columnCount; i++) {
        matrixAsString += "{";
        for (var j = 0; j < columnCount; j++) {
            matrixAsString = matrix[i][j].blockType
                + ", " + matrix[i][j].column
                + ", " + matrix[i][j].row + "}";
        }
        matrix += "\n";
    }
    console.log(matrixAsString);
}*/