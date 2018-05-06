﻿var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, canvasSize, blockSize;
var max = 6;
var spriteSheet = new Image();
var xMoveAmt = .2;
var yMoveAmt = .2;
var timer;
var interval = 1000 / 60;
var images = {};
var URLs = { image1: 'Sprites.png' };
var block;

function Timer() {
    this.last = null;
    this.elapsed = 0;
}

Timer.prototype = {
    tick: function (now) {
        this.last = this.last || now
        this.elapsed = now - this.Last
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
    this.XPos = 0;
    this.YPos = 0;
}

Sprite.prototype = {
    clear: function (canvasX, canvasY){
        ctx.clearRect(canvasX, canvasY, this.size, this.size);
    },
    draw: function (canvasX, canvasY) {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            canvasX, canvasY,
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
        }
    }
}

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new Sprite({ blockType: blockType, row: row, column: column, fps: 4 });
}

function render(now) {
    requestAnimationFrame(render);
    timer.tick(now)
    if (timer.elapsed >= interval) {
        /*block.Sprite.Clear(block.Sprite.XPos, block.Sprite.YPos)
        block.Sprite.YPos += yMoveAmt;
        block.Sprite.Draw(block.Sprite.XPos, block.Sprite.YPos);*/
        var then = timer.elapsed % interval;
        timer.last = now - then;
        // draw sprite
    }
}

function initializeMatrix(columns, rows) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var i = 0; i < columns; i++) {
        initialMatrix[i] = [];
        for (var j = 0; j < rows; j++) {
            var newBlock = new Block(j, i, Math.floor(Math.random() * (max + 1)));
            initialMatrix[i][j] = newBlock;
            newBlock.sprite.draw(j, i);
        }
    }
    return initialMatrix;
}

function buildArrayFromColumns(row) {
    var blockArray = [];
    for (var i = 0; i < columnCount; i++) {
        blockArray.push(matrix[i][row])
    }
    return blockArray;
}

function cleanArray(blockArray) {
    var deleteArray = [];
    for (var i = 1; i < blockArray.length-1; i++) {
        if (blockArray[i].blockType == blockArray[i - 1].blockType) {
            deleteArray.push(blockArray[i]);
            deleteArray.push(blockArray[i-1]);
        }
    }
    return deleteArray;
}

function deleteBlocks(matchingBlocks) {
    for (var j = 0; j < matchingBlocks.length; j++) {
        matchingBlocks[j].blockType = max + 1;
        matchingBlocks[j].sprite.clear(1, 1);
    }
}

function cleanMatrix() {
    for (var i = 0; i < columnCount; i++) {
        var cleanedRow = cleanArray(matrix[i]);
        deleteBlocks(cleanedRow);
    }
    for (var j = 0; j < rowCount; j++) {
        var rowArray = buildArrayFromColumns(j);
        var cleanedColumn = cleanArray(rowArray);
        deleteBlocks(cleanedColumn);
    }
}

function switchBlocks(selector) {
    var tempHolder = selector[0];
    selector[0] = selector[1];
    selector[1] = tempHolder;
}

function dropBlockDown(block) {
    if (block.row == 0 || matrix[block.column][block.row - 1].blockType != max + 1) {
        newBlock.sprite.draw(1, 1);
        return;
    }
    else {
        var selector = [matrix[block.column][block.row], matrix[block.column][block.row - 1]];
        switchBlocks(selector);
        newBlock.sprite.clear(1, 1);
        newBlock.sprite.draw(1, 1);
        dropBlockDown(block);
    }
}

function dropBlocksInRow(column) {
    for (var i = 1; i < rowCount; i++) {
        if (matrix[column][i - 1].blockType == max + 1
            && matrix[column][i].blockType != max + 1) {
            dropBlockDown(matrix[column][i]);
        }
    }
}

function dropAllBlocks() {
    for (var i = 0; i < columnCount; i++) {
        dropBlocksInRow(i);
    }
}

function findHighestBlock(column) {
    for (var i = rowCount - 1; i > 0; i--) {
        if (column[i].blockType != max + 1) {
            return column[i];
        }
    }
    return {};
}

function raiseBlocksUp(currentRow) {
    matrix[currentRow + 1] = matrix[currentRow];
    if (currentRow == 0) {
        return;
    } else if (currentRow = rows) {
        stop();
    }
    else {
        currentRow--;
        raiseBlocksUp(currentRow)
    }
}

function generateRow() {
    var row = [columnCount]
    for (var i = 0; i < columnCount; i++) {
        var newBlock = new Block(0, i, Math.floor(Math.random() * (max + 1)));
        row.push(newBlock);
    }
    return row;
}

function pause() { }
function stop() { }

$(document).ready(function () {
    timer = new Timer();
    //matrix = initializeMatrix(6, 12);
    rowCount = 6;
    columnCount = 12;

    //selector = [matrix[0][0], matrix[1][0]];
    //checkMatrix();
    //logCurrentMatrixState();
});

$(window).load(function () {
    createCanvas();
    //dropAllBlocks();
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

function createCanvas() {
    var canvas = document.getElementById("game");
    canvas.width = window.innerWidth;///110;
    canvas.height = window.innerHeight;///130;
    ctx = canvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    canvasSize = canvasWidth * canvasHeight;
    var temp = rowCount * columnCount;
    blockSize = canvasSize / (temp * temp * 7);
    block = new Block(0, 0, 3);
    matrix = initializeMatrix(rowCount, columnCount);
    requestAnimationFrame(render);
}

/*LoadImages(URLs, draw);

function LoadImages(URLs, callback) {
    var loaded = 0;
    var needed = 0;
    for (var url in URLs)
    {
        needed++;
    }
    for (var url in URLs)
    {
        images[url] = new Image();
        images[url].onload = function () {
            if (++loaded >= numImages) {
                callback(images);
            }
        };
        images[url].src = "~/Images/Sprites.png";
    }
}

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