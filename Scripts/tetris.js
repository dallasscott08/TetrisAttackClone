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

function buildArrayFromRows(column) {
    var coordinatesArray = [];
    for (var r = 0; r < rowCount; r++) {
        coordinatesArray.push(new Coordinates(r, column));
    }
    return coordinatesArray;
}

function checkCombo(block, isRow){
    if(isRow && !block.isFalling && block.blockType >= 0 && block.isComboBlock === true){
        if(block.cleanChecked){
            block.scoreMultiplier = 1;
            block.isComboBlock = null;
            block.cleanChecked = null;
            block.sprite.debug = null;
        }
        else{
            block.cleanChecked = true;
        }
    }
}

function cleanFirstBlockCoords(coordArray, isRow) {
    var countArray = [];
    var matchCounter = 1;
    var firstBlock = matrix[coordArray[0].row][coordArray[0].column];
    var block = matrix[coordArray[1].row][coordArray[1].column];
    var nextBlock = matrix[coordArray[2].row][coordArray[2].column];
    if (block.blockType !== max && block.blockType >= 0 &&
        !block.isFalling && !firstBlock.isFalling && !nextBlock.isFalling &&
        block.blockType === firstBlock.blockType && block.blockType === nextBlock.blockType
        && !firstBlock.isDeleting && !block.isDeleting && !nextBlock.isDeleting) {
        countArray.push(new Coordinates(firstBlock.row, firstBlock.column));
        countArray.push(new Coordinates(block.row, block.column));
        countArray.push(new Coordinates(nextBlock.row, nextBlock.column));
        matchCounter += 2;
    }        
        
    checkCombo(firstBlock, isRow);
    return { matchCounter: matchCounter, countArray: countArray };
}

function checkFirstBlockForGarbage(coordArray) {
    var block = matrix[coordArray[0].row][coordArray[0].column];
    return (block.blockType < 0) ? block.width : 1;
}

function blocksMatch(block1, block2) {
    if (block1.blockType >= 0 && block1.blockType !== max && !block1.isFalling && !block2.isFalling &&
        block1.blockType === block2.blockType && !block1.isDeleting && !block2.isDeleting) {
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
    var startCleanObj = cleanFirstBlockCoords(coordArray, isRow);
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
        
        checkCombo(block, isRow);
        checkCombo(nextBlock, isRow);

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
            player1Score += block.scoreMultiplier;
            matches.push(blockCoord);

            var flashAnimationInfo = {
                frameSpeed: 10, 
                startFrame: 1, 
                totalFrames: 2, 
                padding: 3, 
                startPoint: {x: 0, y: 0}, 
                verticalZone: 0, 
                horizontalZone: block.blockType,
                spriteSheetInfo: blockFlashSprites,
                reverse: true,
                loopCount: 3
            };
            block.sprite.animation = new LoopingSpriteAnimation(flashAnimationInfo);
            block.isDeleting = true;
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
            if(block.scoreMultiplier > 1){
                multiplierArray.push(new MultiplierImage(block.sprite.xPos, block.row * blockSize, block.scoreMultiplier));
            }
            player1Score += block.scoreMultiplier;
            block.sprite.clearRiseOffset();
            if(enableParticleEffects){
                var newParticles = generateCoordinateParticles(block.sprite.xPos, block.row * blockSize, block.blockType);
                particleArrays.push(newParticles);
            }
            block.blockType = max;
            block.isFalling = null;
            block.scoreMultiplier = 1;
            block.isComboBlock = null;
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
        var columnArray = buildArrayFromRows(c);
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

function setColumnComboBlocks(coord) {
    var coords = buildArrayFromRows(coord.column);
    for(var i = 0; i < coord.row; i++){
        var block = matrix[coords[i].row][coord.column];
        if(block.blockType < max){
            block.isComboBlock = false;
        }
    }
}

function setComboBlocks(selector) {
    var coords = selector.coordinates;
    var coords2 = selector.coordinates2;

    if(matrix[coords.row + 1][coords.column].blockType === max) {
        matrix[coords.row][coords.column].isComboBlock = false;
    }
    else if(matrix[coords2.row + 1][coords2.column].blockType === max) {
        matrix[coords2.row][coords2.column].isComboBlock = false;
    }

    if(matrix[coords.row][coords.column].blockType === max) {
        setColumnComboBlocks(coords);    
    }
    else if(matrix[coords2.row][coords2.column].blockType === max) {
        setColumnComboBlocks(coords2);
    }
}

function checkBlock(block) {
    if (block.isFalling && (block.row === rowCount - 1 || matrix[block.row + 1][block.column].blockType !== max)) {
        block.isFalling = false;
        if(spriteType === imageType.PNG){
            var bounceAnimationInfo = {
                frameSpeed: 3, 
                startFrame: 0, 
                totalFrames: 4, 
                padding: 3, 
                startPoint: {x: 0, y: 19}, 
                verticalZone: 0, 
                horizontalZone: block.blockType,
                spriteSheetInfo: blockBounceSprites
            };
            block.sprite.animation = new SpriteAnimation(bounceAnimationInfo);
        }
    }
    else if(!block.isFalling && matrix[block.row + 1][block.column].blockType === max && block.row !== rowCount - 1){
        block.isFalling = true;
        if(block.isComboBlock === null){
            block.isComboBlock = true;
            block.cleanChecked = false;   
            block.sprite.debug = true;
        }
    }
}

function checkAllBlocks() {
    for (var r = 0; r < rowCount - 1; r++) {
        for (var c = 0; c < columnCount; c++) {
            var block = matrix[r][c];
            block.wasSwitched = false;
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

    matrix[block1.row][block1.column] = new Block(block1.row, block1.column, block2.blockType, block2.isFalling, block2.isComboBlock, block2.scoreMultiplier, block2.cleanChecked);
    matrix[block2.row][block2.column] = new Block(block2.row, block2.column, block1.blockType, block1.isFalling, block1.isComboBlock, block1.scoreMultiplier, block1.cleanChecked);
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

function generateBlockType(column){
    var type = getRandNumInRange(0, max - 1);
    var aboveType = matrix[rowCount - 2][column].blockType;
    var leftType = column === 0 ? null : matrix[rowCount - 1][column - 1].blockType;
    if(type !== aboveType && type !== leftType){
        return type;
    }
    else { return generateBlockType(column); }
}

function generateRow() {
    var row = [];
    for (var c = 0; c < columnCount; c++) {
        var newBlock = new Block(rowCount - 1, c, generateBlockType(c));
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