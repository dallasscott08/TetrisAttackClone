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
                    else if(block.row + 1 < rowCount && matrix[block.row + 1][block.column].blockType === max){
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
        for(var i = 0; i < classicSkinMatches.length; i++) {
            var blockCoord = classicSkinMatches[i].shift();
            var block = matrix[blockCoord.row][blockCoord.column];
            var newParticles = initializeCorners(block.sprite.xPos + (blockSize/2), block.row * blockSize + (blockSize/2), particleSpriteImg);
            particleArrays.push(newParticles);
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
            particleArrays = filterMatrix(particleArrays);
        }
        if(circleAlpha > 0 && blockFade) {
            fadeCircles();
        }
    }
}