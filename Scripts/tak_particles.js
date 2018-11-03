﻿// Little Canvas things
/*var canvas = document.querySelector("#canvas"),
    ctx = canvas.getContext('2d');

// Set Canvas to be window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Configuration, Play with these
var config = {
  particleNumber: 800,
  maxParticleSize: 10,
  maxSpeed: 40,
  colorVariation: 50
};

// Colors
var colorPalette = {
    bg: {r:12,g:9,b:29},
    matter: [
      {r:36,g:18,b:42}, // darkPRPL
      {r:78,g:36,b:42}, // rockDust
      {r:252,g:178,b:96}, // solorFlare
      {r:253,g:238,b:152} // totesASun
    ]
};

// Some Variables hanging out
var particles = [],
    centerX = canvas.width / 2,
    centerY = canvas.height / 2,
    drawBg,

// Draws the background for the canvas, because space
drawBg = function (ctx, color) {
    ctx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    ctx.fillRect(0,0,canvas.width,canvas.height);
};

// Particle Constructor
var Particle = function (x, y) {
    // X Coordinate
    this.x = x || Math.round(Math.random() * canvas.width);
    // Y Coordinate
    this.y = y || Math.round(Math.random() * canvas.height);
    // Radius of the space dust
    this.r = Math.ceil(Math.random() * config.maxParticleSize);
    // Color of the rock, given some randomness
    this.c = colorVariation(colorPalette.matter[Math.floor(Math.random() * colorPalette.matter.length)],true );
    // Speed of which the rock travels
    this.s = Math.pow(Math.ceil(Math.random() * config.maxSpeed), .7);
    // Direction the Rock flies
    this.d = Math.round(Math.random() * 360);
};

// Provides some nice color variation
// Accepts an rgba object
// returns a modified rgba object or a rgba string if true is passed in for argument 2
var colorVariation = function (color, returnString) {
    var r,g,b,a, variation;
    r = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation/2)) + color.r);
    g = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation/2)) + color.g);
    b = Math.round(((Math.random() * config.colorVariation) - (config.colorVariation/2)) + color.b);
    a = Math.random() + .5;
    if (returnString) {
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    } else {
        return {r,g,b,a};
    }
};

// Used to find the rocks next point in space, accounting for speed and direction
var updateParticleModel = function (p) {
    var a = 180 - (p.d + 90); // find the 3rd angle
    p.d > 0 && p.d < 180 ? p.x += p.s * Math.sin(p.d) / Math.sin(p.s) : p.x -= p.s * Math.sin(p.d) / Math.sin(p.s);
    p.d > 90 && p.d < 270 ? p.y += p.s * Math.sin(a) / Math.sin(p.s) : p.y -= p.s * Math.sin(a) / Math.sin(p.s);
    return p;
};

// Just the function that physically draws the particles
// Physically? sure why not, physically.
var drawParticle = function (x, y, r, c) {
    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(x, y, r, 0, 2*Math.PI, false);
    ctx.fill();
    ctx.closePath();
};

// Remove particles that aren't on the canvas
var cleanUpArray = function () {
    particles = particles.filter((p) => { 
      return (p.x > -100 && p.y > -100); 
    });
};


var initParticles = function (numParticles, x, y) {
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(x, y));
    }
    particles.forEach((p) => {
        drawParticle(p.x, p.y, p.r, p.c);
    });
};

// That thing
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame ||
     function(callback) {
        window.setTimeout(callback, 1000 / 60);
     };
})();


// Our Frame function
var frame = function () {
  // Draw background first
  drawBg(ctx, colorPalette.bg);
  // Update Particle models to new position
  particles.map((p) => {
    return updateParticleModel(p);
  });
  // Draw em'
  particles.forEach((p) => {
      drawParticle(p.x, p.y, p.r, p.c);
  });
  // Play the same song? Ok!
  window.requestAnimFrame(frame);
};

// Click listener
document.body.addEventListener("click", function (event) {
    var x = event.clientX,
        y = event.clientY;
    cleanUpArray();
    initParticles(config.particleNumber, x, y);
});

// First Frame
frame();

// First particle explosion
initParticles(config.particleNumber);*/












/*var pCanvas = document.querySelector("#particles");
pCanvas.width = pCanvas.clientWidth;
pCanvas.height = pCanvas.clientHeight;*/
var particleCtx;// = pCanvas.getContext("2d");

var particleSettings = {
    density: 20,
    particleSize: 5,
    count: 5,
    gravity: .5,
    maxLife: 100,
    shadowSize: 15
};

var particleTimer,// = new Timer(),
particleArrays = [];

/*function Timer() {
    this.last = null;
    this.elapsed = 0;
}

Timer.prototype = {
    tick: function (now) {
        this.last = this.last || now;
        this.elapsed = now - this.last;
    }
};*/

// Set up a function to create multiple particles
function Particle(x,y, color) {
    // Establish starting positions and velocities
    this.x = x;
    this.y = y;

    // Determine original X-axis speed based on setting limitation
    this.vx = Math.random() * 20 - 10;
    this.vy = Math.random() * 20 - 15;

    this.color = color.body;
    this.highlight = color.highlight
}

// Some prototype methods for the particle's "draw" function
Particle.prototype = {
    step: function(){
        this.x += this.vx;
        this.y += this.vy;

        // Adjust for gravity
        this.vy += particleSettings.gravity;
    },
    clear: function(){
		particleCtx.beginPath();		
        particleCtx.globalCompositeOperation = 'destination-out';
        particleCtx.arc(this.x, this.y, particleSettings.particleSize + 5, 0, 2 * Math.PI, true);
        particleCtx.fill();
    },
    draw: function() {
        // Create the shapes
        //ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        particleCtx.beginPath();
        particleCtx.globalCompositeOperation = 'source-over'
        particleCtx.fillStyle = this.color;
        // Draws a circle of radius 20 at the coordinates 100,100 on the canvas
        /*particleCtx.shadowColor = this.highlight;
        particleCtx.shadowOffsetX = 0;
        particleCtx.shadowOffsetY = 0;
        particleCtx.shadowBlur = 5;*/
        particleCtx.arc(this.x, this.y, particleSettings.particleSize, 0, Math.PI*2, true); 
        particleCtx.closePath();
        particleCtx.fill();
        particleCtx.lineWidth = 1;
        particleCtx.strokeStyle = this.highlight;
        particleCtx.stroke();
    },
    clearShadow: function () {
        particleShadowCtx.beginPath();
        particleShadowCtx.globalCompositeOperation = 'destination-out';
        particleShadowCtx.arc(this.x, this.y, particleSettings.particleSize + particleSettings.shadowSize, 0, 2 * Math.PI, true);
        particleShadowCtx.fill();
    },
    drawShadow: function () {
        particleShadowCtx.beginPath();
        particleShadowCtx.globalCompositeOperation = 'source-over';
        particleShadowCtx.shadowColor = this.highlight;
        particleShadowCtx.shadowOffsetX = 0;
        particleShadowCtx.shadowOffsetY = 0;
        particleShadowCtx.shadowBlur = particleSettings.shadowSize;
        particleShadowCtx.arc(this.x, this.y, particleSettings.particleSize, 0, Math.PI * 2, true);
        particleShadowCtx.closePath();
        particleShadowCtx.fill();
    }
}

function isParticleOffScreen(particle){
    if((particle.x > canvasWidth + (particleSize * 2) || particle.x < (0 - particleSize * 2)) &&
    (particle.y > canvasHeight)){
        return true;
    }else{
        return false;
    }
}

// Remove particles that aren't on the canvas
function cleanUpArray(particles) {
    particles = particles.filter((p) => { 
      return (p.x > -100 && p.y > -100); 
    });
};

function generateCoordinateParticles(x, y, color){
    var particles = [];
    for(var i = 0; i < particleSettings.count; i++){
        particles.push(new Particle(x,y, color));
    }
    return particles;
}

function updateParticlePosition(particles) {
    for(var i = 0; i < particles.length; i++){
        particles[i].clear();
        particles[i].clearShadow();
        particles[i].step();
        particles[i].drawShadow();
        particles[i].draw();
    }
}

/*function render(now) {
    requestAnimFrame(render);
    particleTimer.tick(now);
    if (particleTimer.elapsed >= (1000/60)) {
        var then = particleTimer.elapsed % (1000/60);
        particleTimer.last = now - then;
        for(var i = 0; i < particleArrays.length; i++){
            updateParticlePosition(particleArrays[i]);
            cleanUpArray(particleArrays[i]);
        }
    }
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();*/