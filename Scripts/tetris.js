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

function Coordinates(row,column){
    this.row = row;
    this.column = column;
}

function Block(row, column, blockType) {
    this.row = row;
    this.column = column;
    this.blockType = blockType;
    this.sprite = new Sprite({ blockType: blockType, row: row, column: column, fps: 4 });
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
        var block = matrix[coordArray[i].column][coordArray[i].row];
        var prevBlock = matrix[coordArray[i - 1].column][coordArray[i - 1].row];
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