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

function deleteClassicBlocks(blocks){
    var matches = [];
    for (var j = 0; j < blocks.length; j++) {
        var blockCoord = blocks[j];
        var block = matrix[blockCoord.row][blockCoord.column];
        if (block.blockType < 0) {
            transformGarbage(block.coords);
            j += block.width - 1;
        }
        else if (block.blockType !== max && block.blockType >= 0) {
            player1Score += scoreMultiplier;
            matches.push(blockCoord);
            block.blockType = max;
            block.isFalling = null;
        }
    }
    classicSkinMatches.push(matches);
}

function deleteDefaultBlocks(blocks){
    for (var j = 0; j < blocks.length; j++) {
        var blockCoord = blocks[j];
        var block = matrix[blockCoord.row][blockCoord.column];
        if (block.blockType < 0) {
            transformGarbage(block.coords);
            j += block.width - 1;
        }
        else if (block.blockType !== max && block.blockType >= 0) {
            player1Score += scoreMultiplier;
            block.sprite.clear();
            if(enableParticleEffects){
                var newParticles = generateCoordinateParticles(block.sprite.xPos, block.row * blockSize, block.blockType);
                particleArrays.push(newParticles);
            }
            block.blockType = max;
            block.isFalling = null;
        }
    }
}

function deleteBlocks(matchingBlocks){
    switch(pSettings.effectType) {
        case effectType.EXPLODE:
        case effectType.SHATTER:
            deleteDefaultBlocks(matchingBlocks);
        case effectType.CORNER:
            deleteClassicBlocks(matchingBlocks);
    }
}

function cleanColumns() {
    var deleteCoords = [];
    for (var c = 0; c < columnCount; c++) {
        var columnArray = buildArrayFromRow(c);
        var cleanedRowCoords = cleanArray(columnArray, false);
        if(cleanedRowCoords.length > 0) {
            deleteCoords.push(cleanedRowCoords);
        }
    }
    return deleteCoords;
}

function cleanRows() {
    var deleteCoords = [];
    for (var r = 0; r < rowCount; r++) {
        var rowCoordArray = buildArrayFromColumns(r);
        var cleanedColumnCoords = cleanArray(rowCoordArray, true);
        if(cleanedColumnCoords.length > 0) {
            deleteCoords.push(cleanedColumnCoords);
        }
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
    if (block.isFalling && (block.row === rowCount - 1 || matrix[block.row + 1][block.column].blockType !== max)) {
        block.isFalling = false;
        if(spriteType === imageType.PNG)
            matrix[block.row][block.column].sprite.animation = new Animation(3, 0, 4);
    }
    else if(!block.isFalling && matrix[block.row + 1][block.column].blockType === max && block.row !== rowCount - 1){
        block.isFalling = true;
    }
}

function checkAllBlocks() {
    for (var r = 0; r < rowCount - 1; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            if (block.blockType < 0) {
                checkGarbage(block);
                c += block.width - 1;
            } 
            else if(block.blockType < max){
                checkBlock(block);
            }
        }
    }
}

function switchBlocks(block1Coords, block2Coords) {
    var block1 = matrix[block1Coords.row][block1Coords.column];
    var block2 = matrix[block2Coords.row][block2Coords.column];

    matrix[block1.row][block1.column] = new Block(block1.row, block1.column, block2.blockType, block2.isFalling);
    matrix[block2.row][block2.column] = new Block(block2.row, block2.column, block1.blockType, block1.isFalling);
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

function generateGarbage() {
    var garbageWidth = getRandNumInRange(minGarbageWidth, columnCount);
    var startColumn = Math.floor(Math.random() * (columnCount - garbageWidth));
    var garbage = new Garbage(0, startColumn, garbageWidth, -(garbageWidth - 2));
    garbage.isFalling = true;
    garbage.buildGarbage(true);
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

function topCollisionDetected() {
    for (var c = 0; c < columnCount; c++) {
        if (matrix[1][c].blockType !== max &&
            !matrix[1][c].isFalling) {
            return true;
        }
    }
    return false;
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
            if(block.hasOwnProperty('coords')){
                block.sprite.drawNoOffset();
                c += block.coords.length - 1;
            }
            else if (block.blockType !== max ) {
                block.sprite.drawNoOffset();
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