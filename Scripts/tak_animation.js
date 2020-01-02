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
            else if(block.blockType !== max && !block.isFalling) {
                block.sprite.clearRiseOffset();
                block.sprite.drawRiseOffset();
                if (block.blockType < 0) {
                    c += block.width - 1;
                }
                if(block.sprite.animation != null && !block.sprite.animation.hasOwnProperty('totalLoops') && block.sprite.animation.isAnimationCompleted()) {
                    block.sprite.animation = null;
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
            if (block.blockType !== max && block.isFalling && !block.wasSwitched) {
                block.sprite.clearFallOffset();
                block.sprite.drawFallOffset();
                if(block.blockType < 0){
                    c += block.width - 1;
                }
                if (fallTickCounter === fallTickReset) {
                    if (block.blockType < 0 && !block.wasSwitched) {
                        switchGarbage(new Coordinates(block.row, block.column),
                            new Coordinates(block.row + 1, block.column));
                            matrix[block.row + 1][block.column].wasSwitched = true;
                    }
                    else if(block.row + 1 < rowCount && matrix[block.row + 1][block.column].blockType === max && !block.wasSwitched){
                        switchBlocks(new Coordinates(block.row, block.column),
                            new Coordinates(block.row + 1, block.column));
                            matrix[block.row + 1][block.column].wasSwitched = true;
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

function splitContiguousNumbers(coordArray, isRow){
    var chunks = [];
    var chunk = [coordArray[0]];
    var currentNumber = !isRow ? coordArray[0].row : coordArray[0].column;
    for(var i = 1; i < coordArray.length; i++){
        if(!isRow){
            if(coordArray[i].row === (currentNumber + 1)) {
                currentNumber++;
                chunk.push(coordArray[i]);
            }
            else{
                currentNumber = coordArray[i].row;
                chunks.push(chunk);
                chunk = [coordArray[i]];
            }
        }
        else{
            if(coordArray[i].column === (currentNumber + 1)){
                currentNumber++;
                chunk.push(coordArray[i]);
            }
            else{
                currentNumber = coordArray[i].column;
                chunks.push(chunk);
                chunk = [coordArray[i]];
            }
        }
    }
    chunks.push(chunk);
    return chunks;
}

function updateMultipliers(coordArray, isRow) {
    var chunks = splitContiguousNumbers(coordArray, isRow);
    for(var i = 0; i < chunks.length; i++) {
        //if(chunks[i].length >= matchAmount) {
            var hasMultiplier = chunks[i].some((c) => { return matrix[c.row][c.column].isComboBlock });
            if(hasMultiplier) {
                for(var j = 0; j < chunks[i].length; j++) {
                    var coord = chunks[i][j];
                    matrix[coord.row][coord.column].scoreMultiplier++;
                }
            }
        //}
    }
}

function debugMatrixState(){
    temporary = [];
    for (var r = 0; r < rowCount; r++) {
        for (var c = 0; c < columnCount; c++) {
            if(matrix[r][c].isComboBlock){
                temporary.push(matrix[r][c]);
                matrix[r][c].states.push({140: "tak_animation " + blockStateToString(matrix[r][c])});
            }
        }
    }
}

function blockStateToString(block){
    /*block.row;
    block.column;
    block.blockType;*/
    return "Falling = " + block.isFalling + " Combo = " + block.isComboBlock +
    " Clean C = " + block.cleanChecked + " Multiplier = " + block.scoreMultiplier +
    " Offscreen = " + block.isOffscreen + " Selected = " + block.isSelected;
}

function cleanMatrix() {
    var deleteCoordsColumns = cleanColumns();
    var deleteCoordsRows = cleanRows();
    for (var i = 0; i < deleteCoordsColumns.length; i++) {
        var hasMultiplier = deleteCoordsColumns[i].some((c) => { return matrix[c.row][c.column].isComboBlock });
        if(hasMultiplier){
            var pkl = "";
        }
        debugMatrixState();
        if(temporary.length > 0){
            var hjg = "";
        }
        updateMultipliers(deleteCoordsColumns[i], false);
        deleteBlocks(deleteCoordsColumns[i]);
    }
    for (var j = 0; j < deleteCoordsRows.length; j++) {
        var hasMultiplier = deleteCoordsRows[j].some((c) => { return matrix[c.row][c.column].isComboBlock });
        if(hasMultiplier){
            var pkl = "";
        }
        debugMatrixState();
        if(temporary.length > 0){
            var hjg = "";
        }
        updateMultipliers(deleteCoordsRows[j], true);
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
    globalNow = now;
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
        for(var i = 0; i < classicSkinMatches.length; i++) {
            for(var j = 0; j < classicSkinMatches[i].length; j++) {
                var blockCoord = classicSkinMatches[i][j];
                var block = matrix[blockCoord.row][blockCoord.column];
                if(block.sprite.animation != null &&
                    block.sprite.animation.isAnimationCompleted()) {                    
                    var newParticles = initializeCorners(block.sprite.xPos + (blockSize/2), block.row * blockSize + (blockSize/2), particleSpriteImg);
                    particleArrays.push(newParticles);
                    block.blockType = max;
                    block.isFalling = null;
                    block.isDeleting = false;
                    block.sprite.animation = null;
                    block.scoreMultiplier = 1;
                    block.isComboBlock = false;
                    classicSkinMatches[i][j] = null;
                }
            }
            classicSkinMatches[i] = classicSkinMatches[i].filter(function (el) { return el != null; });
        }
        classicSkinMatches = filterMatrix(classicSkinMatches);
    }
    if (particleTimer.elapsed >= particleInterval) {
        var particleThen = particleTimer.elapsed % particleInterval;
        particleTimer.last = now - particleThen;        
        if(particleArrays.length > 0) {
            updateParticlePosition(particleArrays);
        }
        for(var i = 0; i < particleArrays.length; i++) {
            particleArrays[i] = cleanUpArray(particleArrays[i]);
            if(particleArrays[i].length === 0){
                particleShadowCtx.clearRect(clearRect.xStart, clearRect.yStart, clearRect.xEnd, clearRect.yEnd);
                particleCtx.clearRect(clearRect.xStart, clearRect.yStart, clearRect.xEnd, clearRect.yEnd);
            }
            particleArrays = filterMatrix(particleArrays);
        }
        if(circleAlpha > 0 && blockFade) {
            fadeCircles();
        }
        
        for(var i = 0; i < multiplierArray.length; i++) {
            multiplierArray[i].clear();
            multiplierArray[i].step();
            multiplierArray[i].draw();
        }
        cleanUpArray(multiplierArray);
    }
}