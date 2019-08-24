var particleArrays = [];
var particleCtx, lightSource,particleTimer, particleBufferCanvas, particleBufferCtx, clearRect,
particleSpriteSheet, reverseParticleSpriteSheet;
var cachedParticleImages = {};

var distanceThreshold = 250;

const imageType = {
    PNG: '0',
    PATH: '1',
    VECTOR: '2'
};

const effectType = {
    EXPLODE: '0',
    SHATTER: '1',
    CORNER: '2'
}

var pSettings = {
    density: 20,
    particleSize: 25,
    minParticleSize: 5,
    maxParticleSize: 10,
    countDivisor: 100000,
    gravity: .5,
    acceleration: -.5,
    glowEnabled: false,
    glowAmounts: [8,4],
    minLife: 50,
    maxLife: 100,
    shadowSize: 15,
    particleImageType: imageType.PATH,
    particleSpritesheetSpriteSize: 64,
    spriteSheetId: "particle-sprites",
    reversedSpriteSheetId: "reversed-particle-sprites",
    particleSpriteSheetSpriteOffset: 12,
    particleSpriteSheetFrames: 1,
    particleColorNum: 5,
    minAlpha: .1,
    maxAlpha: 1,
    minMoveSpeed: 10,
    maxMoveSpeed: 100,
    spriteFrameHeight: 8,
    spriteFrameWidth: 9,
    spriteFrameSpeed: 5,
    spriteStartFrame: 0,
    spriteEndFrame: 8,
    spriteFramesPerRow: 4,
    spritesheetZoneSize: 25
};

// Set up a function to create multiple particles
function Particle(x,y, type) {
    // Establish starting positions and velocities
    this.ox = ~~(x + 0.5);
    this.oy = ~~(y + 0.5);
 
    this.x = this.ox;
    this.y = this.oy;
    
    this.life = 0;
    this.type = type;
 
    if(pSettings.effectType === effectType.CORNER) {
        this.spriteSize = pSettings.particleSpriteSize;
        this.spriteSheetFrame = 0;
        this.animation = new SpriteAnimation(pSettings.spriteFrameSpeed, pSettings.spriteStartFrame, pSettings.spriteEndFrame);
        this.endOfLife = 10;
        this.moveAmt = 5;
    }
    else if(pSettings.effectType === effectType.SHATTER) {
        this.slope = calculateSlope({x: getRandNumInRange(0, canvasWidth), y: getRandNumInRange(0, canvasHeight)}, this);
        this.goRight = (Math.floor(Math.random() * 2) == 0);        
    
        // Determine original X-axis speed based on setting limitation
        this.vx = ~~((Math.random() * 20 - 10) + 0.5);
        this.vy = ~~((Math.random() * 20 - 15) + 0.5);
        this.endOfLife = 1;
    }
    else{
        this.color = getColorProperties(this.type);
        this.particleSize = getRandNumInRange(pSettings.minParticleSize, pSettings.maxParticleSize);
        this.slope = calculateSlope({x: getRandNumInRange(0, canvasWidth), y: getRandNumInRange(0, canvasHeight)}, this);
        this.goRight = (Math.floor(Math.random() * 2) == 0);
        this.endOfLife = Math.pow(1.5, this.particleSize);//getRandNumInRange(pSettings.minLife, pSettings.maxLife);
        this.moveAmt = Math.pow(2, 15/this.particleSize);//getRandNumInRange(pSettings.minMoveSpeed, pSettings.maxMoveSpeed);
        
        this.flicker = true;//(Math.floor(Math.random() * 2) == 0);
        this.isFading = true;
        this.flickerAmt = .0075;//Math.pow(.8, this.particleSize);//.5 / this.particleSize;
        this.alpha = .5;
    }
 }

// Some prototype methods for the particle's "draw" function
Particle.prototype = {
    step: function() {
        switch(pSettings.effectType){
            case effectType.EXPLODE:
                //add code to handle particle life
                //modify to calculate new point
                var newPoint = calculateEndPoint(this.slope, this, 
                    this.ox, this.oy, this.moveAmt, this.goRight);
                this.x = newPoint.x;
                this.y = newPoint.y;
                this.life++;
                this.updateMoveSpeed();
                break;
            case effectType.SHATTER:
                this.x += this.vx;
                this.y += this.vy;

                // Adjust for gravity
                this.vy += pSettings.gravity;
                break;
            case effectType.CORNER:
                if(this.life < this.endOfLife - 1){
                    var newPoint = calculateEndPoint(this.slope, this, 
                        this.ox, this.oy, this.moveAmt, this.goRight);
                    this.x = newPoint.x;
                    this.y = newPoint.y;
                    this.life++;
                }
                this.animation.updateFrame();
                this.animation.setSpriteSheetXY(particleSpriteSheet, 3, {x: 19, y: 0}, this.zone, 0);
                if(this.animation.currentFrame === this.animation.animationSequence.length -1)
                {
                    this.life++;
                }
                break;
        }
    },
    draw: function(){
        switch(spriteType){
            case imageType.VECTOR:
                this.drawVector();
                break;
            case imageType.PNG:
                this.drawSprite();
                break;
            case imageType.PATH:
                this.drawArc();
                break;
        }
    },
    drawArc: function() {	
        //particleBufferCtx.image.save();
        particleBufferCtx.image.beginPath();
        particleBufferCtx.image.arc(this.x, this.y, 
            this.particleSize, 0, Math.PI*2, true); 
        particleBufferCtx.image.closePath();
        //particleBufferCtx.image.lineWidth = 3;
        particleBufferCtx.image.fillStyle = this.color.highlight;
        if(this.flicker && this.alpha >= this.flickerAmt){
            this.fade();
            particleBufferCtx.image.globalAlpha = this.alpha;
        }
        particleBufferCtx.image.fill();
        //particleBufferCtx.image.strokeStyle = particle.color.highlight;
        //particleBufferCtx.image.stroke();
        //particleBufferCtx.image.restore();
    },
    drawVector: function() {
        var particleVector = getParticleVectorFromType(this.type);
        var angle = this.x > lightSource.x ? -this.calculateLightAngle() : this.calculateLightAngle();
        var lightDistance = this.percentFromLight();
        var shade = this.selectVector(lightDistance);
        particleCtx.translate(this.x, this.y);
        particleCtx.rotate(angle);
        particleCtx.drawImage(particleVector, -pSettings.particleSize/2, -pSettings.particleSize/2);
        particleCtx.drawImage(shade, -pSettings.particleSize/2, -pSettings.particleSize/2);
        particleCtx.rotate(-angle); 
        particleCtx.translate(-(this.x), -(this.y));
    },
    drawSprite: function() {
        particleCtx.translate(this.x, this.y);
        particleCtx.rotate(this.angle);
        var img = this.flip ? reverseParticleSpriteSheet.image : particleSpriteSheet.image;
        particleCtx.drawImage(img,
            this.animation.frameColumn, this.animation.frameRow,
            particleSpriteSheet.frameWidth, particleSpriteSheet.frameHeight,
            -pSettings.particleSize/2, -pSettings.particleSize/2,
            pSettings.particleSize, pSettings.particleSize);
        particleCtx.rotate(-this.angle); 
        particleCtx.translate(-(this.x), -(this.y));
    },    
    calculateLightAngle: function() {
        var C = {
            x: this.x, 
            y: lightSource.y
        };
        var a = this.pointsDistance(lightSource, C);
        var c = this.pointsDistance({ x: this.x + pSettings.particleSize/2,
            y: this.y + pSettings.particleSize/2 }, lightSource);
        var sin = a/c;       
        return Math.asin(sin);
    },
    calculateSlope: function() {
        return (lightSource.y - this.y) / (lightSource.x - this.x);
    },
    pointsDistance: function(pointa, pointb) {
         return Math.sqrt((Math.pow((pointa.x - pointb.x), 2) + Math.pow((pointa.y - pointb.y), 2)))
    },
    percentFromLight: function() {
        var slope = calculateSlope(this, lightSource);      
        var endOfLight = calculateEndPoint(slope, this, lightSource.x, lightSource.y, 
            lightSource.strength, this.goRight);

        if(isOnScreen(this)){
            return this.pointsDistance(this, lightSource)/
            this.pointsDistance(lightSource, endOfLight);
        }
        else{
            return 0;
        }
    },
    selectVector: function(percent) {
        for(var i = 0; i < pSettings.lightVectors.length; i++){
            if(percent < (i+1)/pSettings.lightVectors.length){
                return cachedParticleImages.lights[i].iCanvas;
            }
        }
        return cachedParticleImages.lights[pSettings.lightVectors.length-1].iCanvas;
    },
    fade: function(){    
        if(this.alpha >= pSettings.maxAlpha){
            this.isFading = true;
        }
        else if(this.alpha <= this.flickerAmt){
            this.isFading = false;
        }
    
        if(!this.isFading){
            this.alpha += this.flickerAmt;
        }
        else{
            this.alpha -= this.flickerAmt;
        }
    },
    updateMoveSpeed: function() {
        if(this.moveAmt < pSettings.minMoveSpeed) {
            this.moveAmt = pSettings.minMoveSpeed;
        }
        else if(this.moveAmt > pSettings.maxMoveSpeed) {
            this.moveAmt = pSettings.maxMoveSpeed;
        }
        else{
            this.moveAmt = this.moveAmt + pSettings.acceleration;
        }
    }
}

function getParticleVectorFromType(type){
    switch(type) {
        case 0://Green
            return cachedParticleImages.greenParticle.iCanvas;
        case 1://Purple
            return cachedParticleImages.purpleParticle.iCanvas;
        case 2://Red
            return cachedParticleImages.redParticle.iCanvas;
        case 3://Yellow
            return cachedParticleImages.yellowParticle.iCanvas;
        case 4://Light Blue
            return cachedParticleImages.lightBlueParticle.iCanvas;
        case 5://Dark Blue
            return cachedParticleImages.darkBlueParticle.iCanvas;
    }
}

// Remove particles that aren't on the canvas
function cleanUpArray(particles) {
    return particles.filter((p) => { 
      return (isOnScreen(p) && p.life < p.endOfLife); 
    });
};

function filterMatrix(matrix) {
    return matrix.filter((pa) => {
        return (pa.length > 0);
    });
}

function drawParticle(particle) {
    particle.step();
    switch(pSettings.particleImageType) {
        case imageType.VECTOR:
            particle.drawVector();    
            break;
        case imageType.PATH:
            particle.drawArc(); 
            break;
        case imageType.PNG:
            particle.drawSprite();  
            break;
    }
}

function drawParticles(particles){
    for(var k = 0; k < particles.length; k++){
        for(var i = 0; i < particles[k].length; i++){
            drawParticle(particles[k][i]);
        }
    }
}

function renderGlow(context, renderCanvas, blurAmts){
    for(var i = 0; i < blurAmts.length; i++){
        context.save();
        context.filter = 'blur(' + blurAmts[i] + 'px) brightness(200%)';
        context.globalCompositeOperation = 'lighter';
        context.drawImage(renderCanvas, 0, 0);
        context.restore();
    }
}

function generateCoordinateParticles(x, y, type) {
    var particles = [];
    var count = getRandNumInRange(pSettings.countRange.min, pSettings.countRange.max);
    for(var i = 0; i < count; i++) {
        particles.push(new Particle(x,y, type));
    }
    return particles;
}

function initializeCorners(x, y, type){
    var particles = [];
    var initialOffset = 5;
    var particle = new Particle(x - initialOffset, y + initialOffset, type);//bottom left
    particle.slope = -1;
    particle.goRight = false;
    particle.zone = type;
    particle.angle = 3.14159;
    particle.flip = true;
    particles.push(particle);
    particle = new Particle(x - initialOffset, y - initialOffset, type);//top left
    particle.slope = 1;
    particle.goRight = false;
    particle.zone = type;
    particle.angle = 0;
    particle.flip = false;
    particles.push(particle);
    particle = new Particle(x + initialOffset, y - initialOffset, type);//top right
    particle.slope = -1;
    particle.goRight = true;
    particle.zone = type;
    particle.angle = 0;
    particle.flip = true;
    particles.push(particle);
    particle = new Particle(x + initialOffset, y + initialOffset, type);//bottom right
    particle.slope = 1;
    particle.goRight = true;
    particle.zone = type;
    particle.angle = 3.14159;
    particle.flip = false;
    particles.push(particle);
    return particles;
}

function updateParticlePosition(particles) {
    //particleBufferCtx.glow.clearRect(0, 0, canvasWidth, canvasHeight);
    //particleBufferCtx.image.clearRect(0, 0, canvasWidth, canvasHeight);
    //particleCtx.strokeStyle = "black";
    //particleCtx.strokeRect(clearRect.xStart, clearRect.yStart, clearRect.xEnd, clearRect.yEnd);
    particleShadowCtx.clearRect(clearRect.xStart, clearRect.yStart, clearRect.xEnd, clearRect.yEnd);//(0, 0, canvasWidth, canvasHeight);
    particleCtx.clearRect(clearRect.xStart, clearRect.yStart, clearRect.xEnd, clearRect.yEnd);//(0, 0, canvasWidth, canvasHeight);

    switch(pSettings.particleImageType){
        case imageType.VECTOR:
            drawParticles(particles);
            particleShadowCtx.drawImage(particleBufferCanvas.glow, 0, 0);
            particleCtx.drawImage(particleBufferCanvas.image, 0, 0);
            break;
        case imageType.PATH:
            drawParticles(particles);
            particleShadowCtx.drawImage(particleBufferCanvas.image, 0, 0);
            particleCtx.drawImage(particleBufferCanvas.image, 0, 0);
            break;
        case imageType.PNG:
            drawParticles(particles);
            particleCtx.drawImage(particleBufferCanvas.image, 0, 0);
            break;
    }
    if(pSettings.glowEnabled && pSettings.particleImageType !== imageType.PNG){
        renderGlow(particleShadowCtx, particleBufferCanvas.glow, pSettings.glowAmounts);
    }
    clearRect = determineClearRect(particles);    
}

function isOnScreen(point){
    return point.x > -100 && point.x < canvasWidth + 100 
    && point.y > -100 && point.y < canvasHeight + 100;
 }

function setupParticleCanvas() {
    var ol = document.getElementById("vectors");
    pSettings.lightVectors = ol.getElementsByTagName("img");

    var particleCanvas = document.getElementById("particles");
    particleCanvas.width = particleCanvas.clientWidth;
    particleCanvas.height = particleCanvas.clientHeight;
    particleCtx = particleCanvas.getContext("2d");

    var shadowCanvas = document.getElementById("particle-shadows");
    shadowCanvas.width = shadowCanvas.clientWidth;
    shadowCanvas.height = shadowCanvas.clientHeight;
    particleShadowCtx = shadowCanvas.getContext("2d");

    particleBufferCanvas = {
        glow: document.getElementById("particle-shadows"),
        image: document.getElementById("particles")
    }; 
    
    particleBufferCanvas.glow.width = particleCanvas.width; 
    particleBufferCanvas.glow.height = particleCanvas.height; 
    particleBufferCanvas.image.width = particleCanvas.width; 
    particleBufferCanvas.image.height = particleCanvas.height;

    particleBufferCtx = { 
        glow: particleBufferCanvas.glow.getContext('2d'),
        image: particleBufferCanvas.image.getContext('2d')
    };

    clearRect = {
        xStart: 0,
        yStart: 0,
        xEnd: particleCanvas.width,
        yEnd: particleCanvas.height
    }

    pSettings.greenColors = buildParticleColorsArray("#01F800");
    pSettings.purpleColors = buildParticleColorsArray("#F818F8");
    pSettings.redColors = buildParticleColorsArray("#F81010");
    pSettings.yellowColors = buildParticleColorsArray("#F8F800");
    pSettings.lightBlueColors = buildParticleColorsArray("#01F8F8");
    pSettings.darkBlueColors = buildParticleColorsArray("#4070F8");
    pSettings.particleImageType = spriteType;

    pSettings.countRange = pSettings.particleImageType === imageType.PATH ? 
    { min: canvasArea / pSettings.countDivisor, max: canvasArea * 10 / pSettings.countDivisor } 
    : { min: canvasArea / pSettings.countDivisor * .2, max: canvasArea * 10 / pSettings.countDivisor * .2};

    particleSpriteSheet = new SpriteGroup(pSettings.spriteSheetId, pSettings.spriteFrameWidth, 
        pSettings.spriteFrameHeight, pSettings.spriteFramesPerRow, pSettings.spritesheetZoneSize, 0);
    reverseParticleSpriteSheet = new SpriteGroup(pSettings.reversedSpriteSheetId, pSettings.spriteFrameWidth, 
        pSettings.spriteFrameHeight, pSettings.spriteFramesPerRow, pSettings.spritesheetZoneSize, 0);

    if(pSettings.particleImageType === imageType.VECTOR){
        cachedParticleImages.greenParticle = new CachedRasterImage(document.getElementById("green-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.purpleParticle = new CachedRasterImage(document.getElementById("purple-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.redParticle = new CachedRasterImage(document.getElementById("red-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.yellowParticle = new CachedRasterImage(document.getElementById("yellow-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.lightBlueParticle = new CachedRasterImage(document.getElementById("blue-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.darkBlueParticle = new CachedRasterImage(document.getElementById("dark-blue-particle"), pSettings.particleSize, pSettings.particleSize, true);
        cachedParticleImages.lights = cacheRasterImagesList(pSettings.lightVectors, pSettings.particleSize, pSettings.particleSize);
    }
}

function compareX( a, b ) {
    if ( a.x < b.x ){
      return -1;
    }
    if ( a.x > b.x ){
      return 1;
    }
    return 0;
}

function compareY( a, b ) {
    if ( a.y < b.y ){
      return -1;
    }
    if ( a.y > b.y ){
      return 1;
    }
    return 0;
}

function determineClearRect(particles){
    var xMins = [];
    var xMaxes = [];
    var yMins = [];
    var yMaxes = [];
    var minX = canvasWidth;
    var maxY = canvasHeight;
    var maxX = 0;
    var minY = 0;
    
    for(var k = 0; k < particles.length; k++){
        var subArrayMinX = canvasWidth;
        var subArrayMinY = canvasHeight;
        var subArrayMaxX = 0;
        var subArrayMaxY = 0;
        for(var i = 0; i < particles[k].length; i++){
            if(particles[k][i].x < subArrayMinX) { subArrayMinX = particles[k][i].x; }
            if(particles[k][i].x > subArrayMaxX) { subArrayMaxX = particles[k][i].x; }
            if(particles[k][i].y < subArrayMinY) { subArrayMinY = particles[k][i].y; }
            if(particles[k][i].y > subArrayMaxY) { subArrayMaxY = particles[k][i].y; }
        }
        xMins.push(subArrayMinX);
        xMaxes.push(subArrayMaxX);
        yMins.push(subArrayMinY);
        yMaxes.push(subArrayMaxY);
    }

    for(var j = 0; j < particles.length; j++){
        if(xMins[j] < minX) {
            minX = xMins[j];
        }
        if(xMaxes[j] > maxX){
            maxX = xMaxes[j];
        }
        if(yMins[j] < minY){
            minY = yMins[j];
        }
        if(yMaxes[j] > maxY){
            maxY = yMaxes[j];
        }
    }

    return {
        xStart: minX - (pSettings.particleSize * pSettings.glowAmounts[0]),
        yStart: minY - (pSettings.particleSize * pSettings.glowAmounts[0]),
        xEnd: maxX + pSettings.particleSize * pSettings.glowAmounts[0] * 2,
        yEnd: maxY + pSettings.particleSize * pSettings.glowAmounts[0] * 2
    }
}
    
function groupBy(objectArray, property) {
    return objectArray.reduce(function (total, obj) {
        let key = obj[property];
        if (!total[key]) {
            total[key] = [];
        }
        total[key].push(obj);
        return total;
    }, {});
}