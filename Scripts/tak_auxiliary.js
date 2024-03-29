﻿function hideSettings() {
    $("#settings-screen").hide();
    $("#main-screen").show();
    if(spriteType === imageType.PNG) {
        document.body.style.fontFamily = "PressStart2P,sans-serif";
    }
}

function showSettings() {
    $("#main-screen").hide();
    $("#settings-screen").show();
    hideScores();
    document.body.style.fontFamily = "Lato,'Century Gothic', Arial, sans-serif";
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

function setSkinProperties(){
    switch(spriteType){
        case imageType.PATH:
            pSettings.effectType = effectType.EXPLODE;
            document.body.style.fontFamily = "Lato,'Century Gothic', Arial, sans-serif";
            break;
        case imageType.VECTOR:
            pSettings.effectType = effectType.SHATTER;
            document.body.style.fontFamily = "Lato,'Century Gothic', Arial, sans-serif";
            break;
        case imageType.PNG:
            pSettings.effectType = effectType.CORNER;
            particleSpriteImg = 0;//getRandNumInRange(0,16);
            document.body.style.fontFamily = "PressStart2P,sans-serif";
            break;
    }
}

function buildSettings() {
    spriteType = getRadioValue('image-type-radio');
    drawBackground();
    $("#settings-screen").hide();
    hideScores();
    garbageEnabled = document.getElementById('garbage-enable').checked;
    var val = getRadioValue('speed-radio');
    xMoveAmt = .2;
    yFallAmt = .17;
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
    fallInterval = 1000 / 60;
    shakeInterval = 1000 / 2;
    glowEnabled = document.getElementById('glow-enable').checked;
    pSettings.glowEnabled = document.getElementById('particle-glow-enable').checked;
    glowAmount = 2;// * blockSize;
    garbageInterval = document.getElementById('interval-input-id').value * 1000;
    pauseMultiplier = document.getElementById('multiplier-input-id').value * 1000;
    maxPauseDuration = pauseMultiplier * 10;
    matchAmount = getRadioValue('match-radio');
    fallTickReset = ~~(1 / yFallAmt + .5);
    riseTickReset = ~~(1 / yRiseAmt + .5);
    skinSettings = new SkinSettings();
    isSinglePlayer = document.getElementById('single-player').checked;
    glowClearBuffer = 20;
    gameGlowAmount = [8];    
    circlesFading = false;
    blockFade = false;
    circleFadeIncrement = .02;
    circleFadeInterval = 3000;
    circleAlpha = 0;
    classicClearInterval = 500;
    maxCleanTime = 1000;
    canvasScale = 1;
    setSkinProperties();
    setSelectorSizeMultiplier();
    var dropAnimationGroup = new SpriteSheetInfo(skinSettings.spriteSheet, skinSettings.blockSpriteSize, skinSettings.blockSpriteSize, 
        1, 76);
    var clearAnimationGroup = new SpriteSheetInfo(skinSettings.spriteSheet, skinSettings.blockSpriteSize, skinSettings.blockSpriteSize, 
        1, 76);
    $("#speed").text(val);
    $("#garbage-interval").text(garbageInterval/1000);
    $("#pause-multiplier").text(pauseMultiplier/1000);
    gameStartTime = performance.now();


    $("#main-screen").show();
}

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