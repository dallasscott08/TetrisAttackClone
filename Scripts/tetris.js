var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize, max, xMoveAmt, yMoveAmt, constMoveAmt, timer, actionInterval, constMoveInterval;

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
    this.xPos = options.row;
    this.yPos = options.column;
}

Sprite.prototype = {
    clear: function () {
        ctx.clearRect(this.xPos * blockSize, this.yPos * blockSize, this.size, this.size);
    },
    draw: function () {
        this.determineXY();
        ctx.drawImage(document.getElementById("sprites"),
            this.pixelsLeft, this.pixelsTop,
            this.spriteSize, this.spriteSize,
            this.xPos * blockSize, this.yPos * blockSize,
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

function Coordinates(x,y){
    this.x = x;
    this.y = y;
}

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new Sprite({ blockType: blockType, row: row, column: column, fps: 4 });
}

function createCanvas() {
    var canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;///110;
    canvas.height = canvas.clientHeight;///130;
    ctx = canvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    blockSize = canvas.clientHeight / rowCount;
    matrix = initializeMatrix(rowCount, columnCount);
    requestAnimationFrame(render);
}

function aniMatrix() {
    for (var c = 0; c < columnCount; c++) {
        for (var r = 0; r < rowCount; r++) {
            var block = matrix[c][r];
            if (block.blockType !== max) {
                block.sprite.clear()
                block.sprite.yPos -= yMoveAmt;
                block.sprite.draw();
            }
        }
    }
}

function render(now) {
    requestAnimationFrame(render);
    timer.tick(now)
    if (timer.elapsed >= actionInterval) {

    }
    if (timer.elapsed >= constMoveInterval) {
        var then = timer.elapsed % constMoveInterval;
        timer.last = now - then;
        aniMatrix();
    }
}

function initializeMatrix(rows, columns) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var c = 0; c < columns; c++) {
        initialMatrix[c] = [];
        for (var r = 0; r < rows; r++) {
            var newBlock = new Block(c, r, Math.floor(Math.random() * (max + 1)));
            initialMatrix[c][r] = newBlock;
            if (newBlock.blockType !== max) {
                newBlock.sprite.draw();
            }
        }
    }
    return initialMatrix;
}

function buildArrayFromColumns(row) {
    var coordinatesArray = [];
    for (var i = 0; i < columnCount; i++) {
        coordinatesArray.push(new Coordinates(row, i));
    }
    return coordinatesArray;
}

function cleanArray(blockArray) {
    var deleteArray = [];
    for (var i = 1; i < blockArray.length - 1; i++) {
        if (blockArray[i].blockType === blockArray[i - 1].blockType) {
            deleteArray.push(new Coordinates(blockArray[i].row, blockArray[i].column));
            deleteArray.push(new Coordinates(blockArray[i - 1].row, blockArray[i - 1].column));
        }
    }
    return deleteArray;
}

function deleteBlocks(matchingBlocks) {
    for (var j = 0; j < matchingBlocks.length; j++) {
        var blockCoord = matchingBlocks[j];
        matrix[blockCoord.x][blockCoord.y].blockType = max;
        matrix[blockCoord.x][blockCoord.y].sprite.clear();
        matchingBlocks[j].blockType = max;
        matchingBlocks[j].sprite.clear();
    }
}

function cleanMatrix() {
    for (var c = 0; c < columnCount; c++) {
        var cleanedRowCoords = cleanArray(matrix[c]);
        deleteBlocks(cleanedRowCoords);
    }
    for (var r = 0; r < rowCount; r++) {
        var rowCoordArray = buildArrayFromColumns(r);
        var cleanedColumnCoords = cleanArray(rowCoordArray);
        deleteBlocks(cleanedColumnCoords);
    }
}

function switchBlocks(block1Coords, block2Coords) {
    var block = matrix[block1Coords.x][block1Coords.y];
    var lowerBlock = matrix[block2Coords.x][block2Coords.y];

    matrix[block.row][block.column] = new Block(block.row, block.column, lowerBlock.blockType);
    matrix[lowerBlock.row][lowerBlock.column] = new Block(lowerBlock.row, lowerBlock.column, block.blockType);

    matrix[block.row][block.column].sprite.clear();
    matrix[lowerBlock.row][lowerBlock.column].sprite.draw();
}

function dropBlockDown(block) {
    if (block.column === rowCount - 1 || matrix[block.row][block.column + 1].blockType !== max) {
        return;
    }
    else {
        switchBlocks(new Coordinates(block.row, block.column), 
        new Coordinates(block.row, block.column + 1));
        dropBlockDown(matrix[block.row][block.column + 1]);
    }
}

function dropBlocksInRow(row) {
    for (var c = 0; c < columnCount; c++) {
        var block = matrix[c][row];
        var lowerblock = matrix[c][row + 1];
        if (lowerblock.blockType === max
            && block.blockType !== max) {
            dropBlockDown(block);
        }
    }
}

function dropAllBlocks() {
    for (var r = rowCount - 2; r > 0; r--) {
        dropBlocksInRow(r);
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
    rowCount = 12;
    columnCount = 6;
    max = 6;
    xMoveAmt = .2;
    yMoveAmt = .2;
    constMoveInterval = 1000 / 1;
    actionInterval = 1000 / 60
    //logCurrentMatrixState();
});

$(window).load(function () {
    createCanvas();
    cleanMatrix();
    dropAllBlocks();
    //selector = [matrix[0][0], matrix[1][0]];
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