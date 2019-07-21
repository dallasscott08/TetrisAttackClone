var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yRiseAmt, yFallAmt, constMoveAmt, timer, riseTimer, fallTimer;
var riseInterval, fallInterval, shakeInterval, riseTickCounter, fallTickCounter, riseTickReset, fallTickReset;
var doAnimation, player1Score, player2Score, fallOffset, riseOffset, matchAmount;
var minGarbageWidth, garbageTimer, garbageInterval, garbageEnabled, actionInterval;
var pauseMultiplier, paused, pauseTimer, pauseDuration, maxPauseDuration, scoreMultiplier;
var skinSettings, enableParticleEffects, isSinglePlayer, selectorCtx, particleShadowCtx;
var particleInterval, xOffset, guideCtx, vectors, spriteType, glowAmount, glowEnabled;
var blockGlowCanvas, blockGlowCtx, fps, canvas, leftGuideX, rightGuideX, glowClearBuffer, gameGlowAmount;
var circleAlpha, circlesFading, circleFadeIncrement, circleFadeInterval, circleFadeTimer, blockFade;
var classicClearTimer, classicClearInterval, classicSkinMatches, gameStartTime;
var times = [];

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

function fadeCircles(){
    if(circleAlpha >= 1){
        circlesFading = true;
    }
    else if(circleAlpha < circleFadeIncrement){
        circlesFading = false;
        circleAlpha = 0;
        return;
    }
 
    if(!circlesFading){
        circleAlpha = circleAlpha + circleFadeIncrement > 1 ? 1 : circleAlpha + circleFadeIncrement;
    }
    else{
        circleAlpha-= circleFadeIncrement;
    }
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
    
    if(deleteCoordsColumns.length > 0 || deleteCoordsRows.length > 0) {
        $("#game, #guides, #selector").effect("shake", {direction:"up", distance:2}, 350);
        if(!blockFade){
            blockFade = true;
            circleAlpha = circleFadeIncrement;
            circlesFading = false;
        }
    }
    $("#p1-score").text(player1Score);
    //$("#p2-score").text(player2Score);
}

function pauseMatrix(now) {
    pauseTimer.tick(now);
    if (pauseTimer.elapsed >= pauseDuration || pauseTimer.elapsed >= maxPauseDuration) {
        var pauseThen = pauseTimer.elapsed % pauseDuration;
        pauseTimer.last = 0;//now - pauseThen;
        pauseDuration = 0;
        paused = false;
        $("#pause-duration").text(0);
    }
    else { 
        paused = true;
        $("#pause-duration").text(((pauseDuration - pauseTimer.elapsed)/1000).toFixed(0));
     }
}

function measureFPS(){
    var now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    $("#fps").text(fps);
}

function render(now) {
    if (!doAnimation) { ctx = null; return; }
    requestAnimFrame(render);
    riseTimer.tick(now);
    fallTimer.tick(now);
    garbageTimer.tick(now);
    timer.tick(now);
    particleTimer.tick(now);
    classicClearTimer.tick(now);
    measureFPS();
    $("#time").text(millisToMinutesAndSeconds(now - gameStartTime));

    if(blockFade){
        circleFadeTimer.tick(now);
    }
    if(circleFadeTimer.elapsed >= circleFadeInterval){
        var fadeThen = circleFadeTimer.elapsed % circleFadeInterval;
        circleFadeTimer.last = now - fadeThen; 
        blockFade = false;
    }
    if (timer.elapsed >= actionInterval) {
        var actionThen = timer.elapsed % actionInterval;
        timer.last = now - actionThen;
        cleanMatrix();
        selector.sprite.drawNoOffset();
    }
    if (pauseDuration > 0) {
        pauseMatrix(now);
    }
    if (fallTimer.elapsed >= fallInterval) {
        var cd = fallTimer.elapsed % fallInterval;
        fallTimer.last = now - cd;
        blockGlowCtx.clearRect(leftGuideX - glowClearBuffer, 0, rightGuideX - leftGuideX + glowClearBuffer * 2, canvasHeight);
        aniMatrixFalling();
        if(glowEnabled && spriteType !== imageType.PNG) { renderGlow(blockGlowCtx, canvas, gameGlowAmount); }
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
        blockGlowCtx.clearRect(leftGuideX - glowClearBuffer, 0, rightGuideX - leftGuideX  + glowClearBuffer * 2, canvasHeight);
        aniMatrixRising();
        if(glowEnabled && spriteType !== imageType.PNG) { renderGlow(blockGlowCtx, canvas, gameGlowAmount); }
        selector.sprite.drawNoOffset();
    }
    if (pSettings.effectType === effectType.CORNER && classicSkinMatches.length > 0 && classicClearTimer.elapsed >= classicClearInterval) {
        var clearThen = classicClearTimer.elapsed % classicClearInterval;
        classicClearTimer.last = now - clearThen;
        var blockCoord = classicSkinMatches.shift();;
        var block = matrix[blockCoord.row][blockCoord.column];
        block.blockType = max;
        block.sprite.clear();
        var newParticles = initializeCorners(block.sprite.xPos, block.row * blockSize, blockCoord.type);
        particleArrays.push(newParticles);
    }
    if (particleTimer.elapsed >= particleInterval) {
        var particleThen = particleTimer.elapsed % particleInterval;
        particleTimer.last = now - particleThen;        
        if(particleArrays.length > 0) {
            updateParticlePosition(particleArrays);
        }
        for(var i = 0; i < particleArrays.length; i++) {
            particleArrays[i] = cleanUpArray(particleArrays[i]);
            particleArrays = cleanParticleMatrix();
        }
        if(circleAlpha > 0 && blockFade) {
            fadeCircles();
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
    if(pSettings.effectType === effectType.CORNER) {var type = getRandNumInRange(0,16);}
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
            if(pSettings.effectType === effectType.CORNER){
                blockCoord.type = type;
                classicSkinMatches.push(blockCoord);
            }
            else{
                block.sprite.clear();
                if(enableParticleEffects){
                    var newParticles = generateCoordinateParticles(block.sprite.xPos, block.row * blockSize, block.blockType);
                    particleArrays.push(newParticles);
                }
            }
            block.blockType = max;
        }
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
    var garbageWidth = getRandNumInRange(minGarbageWidth, columnCount);
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
            if (r < ~~((rows / 1.5 + 0.5))) {
                newBlock = new Block(r, c, max);
            }
            else {
                newBlock = new Block(r, c, Math.floor(Math.random() * (max + 1)));
            }
            initialMatrix[r][c] = newBlock;
            if (newBlock.blockType !== max) {
                newBlock.sprite.drawNoOffset();
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

    canvas = document.getElementById("game");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx = canvas.getContext("2d");

    var selectorCanvas = document.getElementById("selector");
    selectorCanvas.width = selectorCanvas.clientWidth;
    selectorCanvas.height = selectorCanvas.clientHeight;
    selectorCtx = selectorCanvas.getContext("2d");

    blockGlowCanvas = document.getElementById("block-glow");
    blockGlowCanvas.width = blockGlowCanvas.clientWidth;
    blockGlowCanvas.height = blockGlowCanvas.clientHeight;
    blockGlowCtx = blockGlowCanvas.getContext("2d");

    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    blockSize = ~~((canvas.clientHeight / (rowCount - 2)) + 0.5);

    lightSource = {
        x: ~~(canvasWidth / 2 + 0.5),
        y: 0,
        strength: 1000
    };

    setupParticleCanvas();
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
            matrix[block.row + 1][block.column].sprite.drawNoOffset();
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
    $("#settings-screen").hide();
    $("#main-screen").show();
}

function showSettings() {
    $("#main-screen").hide();
    $("#settings-screen").show();
    hideScores();
}

function hideScores(){
    $("#scoreboard").hide(); 
    $("#settings-display").hide(); 
}

function showScores(){   
    $("#scoreboard").show();
    $("#settings-display").show();
    if(!isSinglePlayer){ $("#p2-score").show(); } 
}

function pause() { paused = paused ? false : true; }
function stop() {
    $("#game-over").show();
    doAnimation = false;
}

function restart() {
    player1Score = 0;
    player2Score = 0;
    start();
    $("#game-over").hide();
}

function quit() {
    $("#game").hide();
    $("#performance").hide();
    hideScores();
    $("#game-over").hide();
    $("#main-screen").show();
}

function drawGuides(){
    var guideWidth = 2;
    var shadowSize = 30;
    leftGuideX = xOffset - guideWidth - 1;
    rightGuideX = columnCount * blockSize + xOffset  + guideWidth + 1;
    var bottomGuideY = canvasHeight + 1;

    guideCtx.beginPath();
    guideCtx.moveTo(leftGuideX, 15);
    guideCtx.lineWidth = guideWidth;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.lineTo(leftGuideX, bottomGuideY);
      
    guideCtx.moveTo(rightGuideX, 15);
    guideCtx.lineWidth = guideWidth;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.lineTo(rightGuideX, bottomGuideY);
    
    guideCtx.moveTo(leftGuideX, bottomGuideY);
    guideCtx.lineWidth = guideWidth;
    guideCtx.strokeStyle = skinSettings.guideColor;
    guideCtx.lineTo(rightGuideX, bottomGuideY);
    guideCtx.stroke();
    guideCtx.closePath();

    guideCtx.rect(leftGuideX, 0, rightGuideX-leftGuideX, canvasHeight);
    guideCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    guideCtx.fill();
}

function start() {
    $("#main-screen").hide();
    moveScoreLocation();
    showScores();
    $("#game").show();
    $("#performance").show();
    createCanvas();
    xOffset = isSinglePlayer ? canvasWidth / 2 - (blockSize * columnCount) / 2 : canvasWidth / 3 - (blockSize * columnCount) / 2;
    xOffset = ~~(xOffset + 0.5);
    doAnimation = true;
    matrix = initializeMatrix(rowCount, columnCount);
    selector = new Selector(new Coordinates(~~(rowCount / 2 + 0.5), ~~(columnCount / 3 + 0.5))); 
    cleanColumns();
    dropAllBlocks();
    cleanRows();
    dropAllBlocks();
    resetMatrixPosition();
    drawGuides();
    selector.sprite.drawNoOffset();
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
        $("#p1-score").animate({ left: '230px' });
        $("#p2-score").hide();
    }
    else{
        $("#p1-score").animate({ top: '230px' });
        $("#p2-score").show();
    }
}

function setEffectType(){
    switch(spriteType){
        case imageType.PATH:
            pSettings.effectType = effectType.EXPLODE;
            break;
        case imageType.VECTOR:
            pSettings.effectType = effectType.SHATTER;
            break;
        case imageType.PNG:
            pSettings.effectType = effectType.CORNER;
            break;
    }
}

function buildSettings() {
    $("#settings-screen").hide();
    hideScores();
    garbageEnabled = document.getElementById('garbage-enable').checked;
    var val = getRadioValue('speed-radio');
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
    shakeInterval = 1000 / 2;
    glowEnabled = document.getElementById('glow-enable').checked;
    pSettings.glowEnabled = document.getElementById('particle-glow-enable').checked;
    glowAmount = 2;// * blockSize;
    garbageInterval = document.getElementById('interval-input-id').value * 1000;
    pauseMultiplier = document.getElementById('multiplier-input-id').value * 1000;
    maxPauseDuration = pauseMultiplier * 10;
    matchAmount = getRadioValue('match-radio');
    fallTickReset = 1 / yFallAmt;
    riseTickReset = 1 / yRiseAmt;
    skinSettings = new SkinSettings();
    isSinglePlayer = document.getElementById('single-player').checked;
    glowClearBuffer = 20;
    gameGlowAmount = [8];    
    spriteType = getRadioValue('image-type-radio');
    circlesFading = false;
    blockFade = false;
    circleFadeIncrement = .02;
    circleFadeInterval = 3000;
    circleAlpha = 0;
    classicClearInterval = 500;
    setEffectType();
    setSelectorSizeMultiplier();
    var dropAnimationGroup = new SpriteGroup(skinSettings.spriteSheet, skinSettings.blockSpriteSize, skinSettings.blockSpriteSize, 
        1, 76);
    var clearAnimationGroup = new SpriteGroup(skinSettings.spriteSheet, skinSettings.blockSpriteSize, skinSettings.blockSpriteSize, 
        1, 76);
    $("#speed").text(val);
    $("#garbage-interval").text(garbageInterval/1000);
    $("#pause-multiplier").text(pauseMultiplier/1000);
    gameStartTime = performance.now();


    $("#main-screen").show();
}

$(document).ready(function () {
    drawBackground();
    riseTimer = new Timer();
    fallTimer = new Timer();
    garbageTimer = new Timer();
    timer = new Timer();
    pauseTimer = new Timer();
    particleTimer = new Timer();
    shakeTimer = new Timer();
    circleFadeTimer = new Timer();
    classicClearTimer = new Timer();
    classicSkinMatches = [];
    rowCount = 12 + 2;
    columnCount = 6;
    minGarbageWidth = ~~(columnCount / 2 + 0.5);
    max = 6;

    fallTickCounter = 0;
    riseTickCounter = 0;
    player1Score = 0;
    player2Score = 0;
    fallOffset = 0;
    riseOffset = 0;
    pauseDuration = 0;
    scoreMultiplier = 1;
    shaking = false;
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

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    //var milliseconds  = ((millis % 1000) / 100).toFixed(0);
    return pad(minutes) + ":" + pad(seconds);// + "'" + pad(milliseconds,3);
}

function pad(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();