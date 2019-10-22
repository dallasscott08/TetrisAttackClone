var matrix;//6 columns x 12 rows
var selector, rowCount, columnCount, ctx, canvasWidth, canvasHeight, blockSize;
var max, xMoveAmt, yRiseAmt, yFallAmt, constMoveAmt, timer, riseTimer, fallTimer;
var riseInterval, fallInterval, shakeInterval, riseTickCounter, fallTickCounter, riseTickReset, fallTickReset;
var doAnimation, player1Score, player2Score, fallOffset, riseOffset, matchAmount;
var minGarbageWidth, garbageTimer, garbageInterval, garbageEnabled, actionInterval;
var pauseMultiplier, paused, pauseTimer, pauseDuration, maxPauseDuration;
var skinSettings, enableParticleEffects, isSinglePlayer, selectorCtx, particleShadowCtx;
var particleInterval, xOffset, guideCtx, vectors, spriteType, glowAmount, glowEnabled;
var blockGlowCanvas, blockGlowCtx, fps, canvas, leftGuideX, rightGuideX, glowClearBuffer, gameGlowAmount;
var circleAlpha, circlesFading, circleFadeIncrement, circleFadeInterval, circleFadeTimer, blockFade;
var classicClearTimer, classicClearInterval, classicSkinMatches, gameStartTime, blockBounceSprites, blockTransformSprites;
var times = [];
var cachedCubeImages = {};

function initializeMatrix(rows, columns) {
    var initialMatrix = [];

    rowCount = rows;
    columnCount = columns;
    for (var r = 0; r <= rows - 1; r++) {
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
    
    blockBounceSprites = new SpriteSheetInfo(skinSettings.spriteSheet, skinSettings.blockSpriteSize, 
        skinSettings.blockSpriteSize, 1, pSettings.spritesheetZoneSize, skinSettings.blockSpriteSize + 3);
    blockTransformSprites = new SpriteSheetInfo(skinSettings.spriteSheet, skinSettings.blockSpriteSize, 
        skinSettings.blockSpriteSize, 1, pSettings.spritesheetZoneSize, skinSettings.blockSpriteSize + 3);
    blockFlashSprites = new SpriteSheetInfo(skinSettings.spriteSheet, skinSettings.blockSpriteSize, 
        skinSettings.blockSpriteSize, 1, pSettings.spritesheetZoneSize, skinSettings.blockSpriteSize + 3);

    setupParticleCanvas();
    setupGameTextCanvas();

    if(spriteType === imageType.VECTOR){
        cachedCubeImages.greenCube = new CachedRasterImage(document.getElementById("green-cube"), blockSize, blockSize, true);
        cachedCubeImages.purpleCube = new CachedRasterImage(document.getElementById("purple-cube"), blockSize, blockSize, true);
        cachedCubeImages.redCube = new CachedRasterImage(document.getElementById("red-cube"), blockSize, blockSize, true);
        cachedCubeImages.yellowCube = new CachedRasterImage(document.getElementById("yellow-cube"), blockSize, blockSize, true);
        cachedCubeImages.lightBlueCube = new CachedRasterImage(document.getElementById("blue-cube"), blockSize, blockSize, true);
        cachedCubeImages.darkBlueCube = new CachedRasterImage(document.getElementById("dark-blue-cube"), blockSize, blockSize, true); 
        cachedCubeImages.selector = new CachedRasterImage(document.getElementById(skinSettings.selectorVector), ~~((blockSize * skinSettings.heightMultiplier) + 0.5), ~~((blockSize * skinSettings.widthMultiplier) + 0.5), true);  
        cachedCubeImages.garbage1 = new CachedRasterImage(document.getElementById("garbage1"), blockSize, blockSize * 3, true);    
        cachedCubeImages.garbage2 = new CachedRasterImage(document.getElementById("garbage2"), blockSize, blockSize * 4, true);    
        cachedCubeImages.garbage3 = new CachedRasterImage(document.getElementById("garbage3"), blockSize, blockSize * 5, true);    
        cachedCubeImages.garbage4 = new CachedRasterImage(document.getElementById("garbage4"), blockSize, blockSize * 6, true);  
    }
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
                    setComboBlocks(selector);
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

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();