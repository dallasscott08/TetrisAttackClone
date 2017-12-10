var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx;
var max = 6;

function initializeMatrix(columns, rows) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var i = 0; i < columns; i++) {
        initialMatrix[i] = [];
        for (var j = 0; j < rows; j++) {
            var newBlock = {};
            newBlock.blockType = Math.floor(Math.random() * (max + 1));
            newBlock.column = i;
            newBlock.row = j;
            initialMatrix[i][j] = newBlock;
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

function checkArray(blockArray) {
    var deleteArray = [];
    for (var i = 1; i < blockArray.length-1; i++) {
        if (blockArray[i].blockType == blockArray[i - 1].blockType) {
            deleteArray.push(blockArray[i]);
            deleteArray.push(blockArray[i-1]);
        }
    }
    return deleteArray;
}

function checkMatrix() {
    for (var i = 0; i < columnCount; i++) {
        var checkedColumn = checkArray(matrix[i]);
        deleteBlocks(checkedColumn);
    }
    for (var j = 0; j < rowCount; j++) {
        var rowArray = buildArrayFromColumns(j);
        var checkedRow = checkArray(rowArray);
        deleteBlocks(checkedRow);
    }
}

function switchBlocks(selector) {
    var tempHolder = selector[0];
    selector[0] = selector[1];
    selector[1] = tempHolder;
}

function deleteBlocks(matchingBlocks) {
    for (var j = 0; j < matchingBlocks.length; j++) {
        matchingBlocks[j].blockType = max + 1;
    }
}

function dropBlockDown(block) {
    if (block.row == 0 || matrix[block.column][block.row - 1].blockType != max + 1) {
        return;
    }
    else {
        var selector = [matrix[block.column][block.row], matrix[block.column][block.row - 1]];
        switchBlocks(selector)
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
        var newBlock = {};
        newBlock.blockType = Math.floor(Math.random() * max);
        newBlock.column = i;
        newBlock.row = 0;
        row.push(newBlock);
    }
    return row;
}

function pause() { }
function stop() { }

$(document).ready(function () {
    matrix = initializeMatrix(6, 12);
    createCanvas();

    selector = [matrix[0][0], matrix[1][0]];
    checkMatrix();
    dropAllBlocks();
    logCurrentMatrixState();
});

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
    ctx = canvas.getContext("2d");
    var blockSprite = new Sprite(0);
    blockSprite.draw(9, 15);
    //var img = document.getElementById("sprites");
    //ctx.drawImage(img, 10, 10);
}

function Sprite(blockType) {
    this.size = 50;
    this.spriteSize = 8;
    this.blockType = blockType;
}

Sprite.prototype = {
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

function logCurrentMatrixState() {
    var matrixAsString;
    for (var i = 0; i < columnCount; i++) {
        matrixAsString += "{";
        for (var j = 0; j < columnCount; j++) {
            matrixAsString = matrix[i][j].blockType
                + ", " + matrix[i][j].column
                + ", " + matrix[i][j] .row + "}";
        }
        matrix += "\n";
    }
    console.log(matrixAsString);
}