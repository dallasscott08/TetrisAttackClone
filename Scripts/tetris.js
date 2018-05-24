var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yMoveAmt, constMoveAmt, timer, actionInterval;
var constMoveInterval, fallingInterval, riseTickCounter, fallTickCounter, doAnimation;

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

function Sprite(options) {
    this.size = blockSize;
    this.spriteSize = 7;
    this.blockType = options.blockType;
    this.interval = 1000 / options.fps;
    this.row = options.row;
    this.column = options.column;
    this.now = new Date().getTime();
    this.xPos = options.row+1;
    this.yPos = options.column;
}

Sprite.prototype = {
    clear: function () {
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
    determineXY: function () {
        switch (this.blockType) {
            case 0:
                this.pixelsLeft = 0;
                this.pixelsTop = 0;
                break;
            case 1:
                this.pixelsLeft = 8;
                this.pixelsTop = 0;
                break;
            case 2:
                this.pixelsLeft = 16;
                this.pixelsTop = 0;
                break;
            case 3:
                this.pixelsLeft = 0;
                this.pixelsTop = 8;
                break;
            case 4:
                this.pixelsLeft = 8;
                this.pixelsTop = 8;
                break;
            case 5:
                this.pixelsLeft = 16;
                this.pixelsTop = 8;
                break;
            case 6:
                this.pixelsLeft = 0;
                this.pixelsTop = 16;
                break;
            case 7:
                this.pixelsLeft = 8;
                this.pixelsTop = 16;
                break;
            case 8:
                this.pixelsLeft = 16;
                this.pixelsTop = 16;
                break;
            case 9:
                this.pixelsLeft = 0;
                this.pixelsTop = 24;
                break;
            case 10:
                this.pixelsLeft = 8;
                this.pixelsTop = 24;
                break;
        }
    }
}

function Selector(coordinates)
{
    this.block1 = new Coordinates(coordinates.row, coordinates.column);
    this.block2 = new Coordinates(coordinates.row, coordinates.column + 1);
    this.sprite1 = new Sprite({ blockType: 9, row: coordinates.row, column: coordinates.column, fps: 4 });
    this.sprite2 = new Sprite({ blockType: 10, row: coordinates.row, column: coordinates.column + 1, fps: 4 });
}

function Coordinates(row, column) {
    this.row = row;
    this.column = column;
}

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new Sprite({ blockType: blockType, row: row, column: column, fps: 4 });
    this.isFalling = false;
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
    requestAnimationFrame(render);
}

function aniMatrixRising() {
    riseTickCounter++;
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType !== max && !block.isFalling) {
                block.sprite.clear();
                block.sprite.xPos -= xMoveAmt;
                block.sprite.draw();
            }
        }
    }
    if (riseTickCounter === 5) {
        cleanColumns();
        cleanRows();
        checkAllBlocks();
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

function render(now) {
    if (!doAnimation) { ctx = null; return; }
    requestAnimationFrame(render);
    timer.tick(now);
    if (timer.elapsed >= actionInterval) {
        selector.sprite1.draw();
        selector.sprite2.draw();
    }
    if (timer.elapsed >= fallingInterval) {
        aniMatrixFalling();
    }
    if (timer.elapsed >= constMoveInterval) {
        var then = timer.elapsed % constMoveInterval;
        timer.last = now - then;
        aniMatrixRising();
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
    for (var i = 0; i < columnCount; i++) {
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
        if (block.blockType === prevBlock.blockType) {
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
        matrix[blockCoord.row][blockCoord.column].sprite.clear();
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

function cleanMatrix() {
    cleanColumns();
    dropAllBlocks();
    cleanRows();
    dropAllBlocks();
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
        if (matrix[block.row + 1][block.column].blockType != max) {
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
        var newBlock = new Block(rowCount-1, c, Math.floor(Math.random() * (max)));
        row.push(newBlock);
    }
    return row;
}

function resetBlockPositions() {    
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            if (matrix[r][c].blockType !== max) {
                matrix[r][c].sprite.clear();
                matrix[r][c].sprite.xPos = matrix[r][c].row + 1;
                matrix[r][c].sprite.draw();
            }
        }
    }
}

function checkMatrixPosition() {
    if (!topCollisionDetected()) {
        raiseBlocksUpLogically();
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
    timer = new Timer();
    rowCount = 12;
    columnCount = 6;
    max = 6;
    xMoveAmt = .2;
    yMoveAmt = .2;
    constMoveInterval = 1000 / 1;
    actionInterval = 1000 / 60;
    fallingInterval = 1000 / 60;
    fallTickCounter = 0;
    riseTickCounter = 0;
    doAnimation = true;
    //logCurrentMatrixState();
});

$(window).load(function () {
    createCanvas();
    cleanMatrix();
    checkMatrixPosition();
    selector = new Selector(new Coordinates(rowCount / 4, columnCount / 2));
    //logCurrentMatrixState();
})

/*$(document).keydown(function (event) {
    var selector = [];
    switch (event.keyCode) {
        case KEY.LEFT:
            break;
        case KEY.RIGHT:
            break;
        case KEY.UP:
            break;
        case KEY.DOWN:
            break;
    }
    //switchBlocks(selector);
    //checkMatrix();
    //dropAllBlocks();
});*/

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