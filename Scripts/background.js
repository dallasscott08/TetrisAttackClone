var backgroundCanvas, backgroundCtx, starCount, center, canvasArea;
var circleCountMultiplier = .0001;
var maxLength = 20;
var colors = ["#01F800", "#F8F800", "#F81010", "#F818F8", "#4070F8", "#01F8F8"];
var zoneCount = 5;
var starSize = {
    minLength: 10,
    maxLength: 50,
    minWidth: .5,
    maxWidth: .75
};
var bgGlowAmount = [8,4];

function drawBackground(){

    backgroundCanvas = document.getElementById("background");
    backgroundCanvas.width = backgroundCanvas.clientWidth;
    backgroundCanvas.height = backgroundCanvas.clientHeight;
    backgroundCtx = backgroundCanvas.getContext("2d");
    center = { x: backgroundCanvas.width/2, y: backgroundCanvas.height/2 };
    var radius = backgroundCanvas.height;
    var lineWidth = 2;
    var ringCount = 3;
    var ringWidthDivisor = 20;
    canvasArea = backgroundCanvas.height * backgroundCanvas.width;
    starCount = circleCountMultiplier * canvasArea;

    //drawPlainGradientCircle(center, radius, lineWidth);
    for(var i = 0; i < ringCount; i++){
        drawGradientLine(center, 
            radius / ringWidthDivisor * Math.pow(2, i + 2),
            lineWidth * Math.pow(2, i));
    }
    drawStars();
    renderGlow(backgroundCtx, backgroundCanvas, bgGlowAmount);
}

function drawPlainGradientCircle(center, radius, lineWidth){

    var gradient = backgroundCtx.createLinearGradient(center.x - radius,
        center.x, 
        center.x + radius,
        center.x);

    // Add three color stops
    gradient.addColorStop(0, '#01F800');//green
    gradient.addColorStop(.2, '#F818F8');//purple
    gradient.addColorStop(.4, '#F81010');//red
    gradient.addColorStop(.6, '#F8F800');//yellow
    gradient.addColorStop(.8, '#01F8F8');//light blue
    gradient.addColorStop(1, '#4070F8');//dark blue

    backgroundCtx.save();
    backgroundCtx.beginPath();
    backgroundCtx.arc(center.x, center.y, 
        radius, 0, Math.PI*2, true); 
    backgroundCtx.closePath();
    backgroundCtx.lineWidth = lineWidth;
    backgroundCtx.strokeStyle = gradient;
    backgroundCtx.stroke();
    backgroundCtx.restore();
}

function drawGradientLine(center, radius, lineWidth){
    
    var zones = [
        {
            "angleStart": 0,
            "angleEnd": Math.PI * 2/6,
            "x1": radius * Math.cos(0) + center.x,//center.x,
            "y1": radius * Math.sin(0) + center.y,//center.y - radius,
            "x2": radius * Math.cos(1.0472) + center.x,//center.x + radius,//
            "y2": radius * Math.sin(1.0472) + center.y,//center.y,//
            "colorStops": [
                { "stop": 0, "color": "#01F800" },//green
                { "stop": 1, "color": "#F8F800" }//yellow
            ]
        },
        {
            "angleStart": Math.PI * 2/6,
            "angleEnd": Math.PI * 4/6,
            "x1": radius * Math.cos(1.0472) + center.x,//center.x + radius,
            "y1": radius * Math.sin(1.0472) + center.y,//center.y,
            "x2": radius * Math.cos(2.0944) + center.x,//center.x,
            "y2": radius * Math.sin(2.0944) + center.y,//center.y + radius,
            "colorStops": [
                { "stop": 0, "color": "#F8F800" },//yellow
                { "stop": 1, "color": "#F81010" }//red
            ]
        },
        {
            "angleStart": Math.PI * 4/6,
            "angleEnd": Math.PI,
            "x1": radius * Math.cos(2.0944) + center.x,//center.x,
            "y1": radius * Math.sin(2.0944) + center.y,//center.y + radius,
            "x2": radius * Math.cos(3.14159) + center.x,//center.x - radius,
            "y2": radius * Math.sin(3.14159) + center.y,//center.y,
            "colorStops": [
                { "stop": 0, "color": "#F81010" },//red
                { "stop": 1, "color":  "#F818F8"}//purple
            ]
        },
        {
            "angleStart": Math.PI,
            "angleEnd": Math.PI * 8/6,
            "x1": radius * Math.cos(3.14159) + center.x,//center.x - radius,
            "y1": radius * Math.sin(3.14159) + center.y,//center.y,
            "x2": radius * Math.cos(4.18879) + center.x,//center.x,
            "y2": radius * Math.sin(4.18879) + center.y,//center.y - radius,
            "colorStops": [
                { "stop": 0, "color": "#F818F8" },//purple
                { "stop": 1, "color": "#4070F8" }//dark blue
            ]
        },
        {
            "angleStart": Math.PI * 8/6,
            "angleEnd": Math.PI * 10/6,
            "x1": radius * Math.cos(4.18879) + center.x,//center.x,
            "y1": radius * Math.sin(4.18879) + center.y,//center.y + radius,
            "x2": radius * Math.cos(5.23599) + center.x,//center.x - radius,
            "y2": radius * Math.sin(5.23599) + center.y,//center.y,
            "colorStops": [
                { "stop": 0, "color": "#4070F8" },//dark blue
                { "stop": 1, "color":  "#01F8F8"}//light blue
            ]
        },
        {
            "angleStart": Math.PI * 10/6,
            "angleEnd": Math.PI * 2,
            "x1": radius * Math.cos(5.23599) + center.x,//center.x - radius,
            "y1": radius * Math.sin(5.23599) + center.y,//center.y,
            "x2": radius * Math.cos(6.28319) + center.x,//center.x,
            "y2": radius * Math.sin(6.28319) + center.y,//center.y - radius,
            "colorStops": [
                { "stop": 0, "color": "#01F8F8" },//light blue
                { "stop": 1, "color": "#01F800" }//green
            ]
        }  
    ];

    for (var i = 0; i < zones.length; ++i) {
        var zone = zones[i];
        var gradient = backgroundCtx.createLinearGradient(zone.x1, zone.y1, zone.x2, zone.y2);
        // Color stops.
        for (var j = 0; j < zone.colorStops.length; ++j) {
          var cs = zone.colorStops[j]; 
          gradient.addColorStop(cs.stop, cs.color);
        }
        // Draw arc.
        backgroundCtx.beginPath();
        backgroundCtx.arc(center.x, center.y, radius, zone.angleStart, zone.angleEnd);
        backgroundCtx.strokeStyle = gradient;
        backgroundCtx.lineWidth = lineWidth;
        backgroundCtx.stroke();
    }
}

function determineY(m, star, x) {
    return (m * x) - (m * star.x) + star.y;
}

function determineX(m, star, y) {
    return (y - star.y + (m * star.x))/m;
}

function calculateCanvasEdgePoint(star) {
    var slope = calculateSlope(star);
    var edgePoint = {};
    if(star.y < backgroundCanvas.height/2 && star.y < star.x)
    {
        edgePoint.y = 0;
        edgePoint.x = determineX(slope, star, edgePoint.y);
    }
    else if(star.x < backgroundCanvas.width/2 && star.x < star.y){
        edgePoint.x = 0;
        edgePoint.y = determineY(slope, star, edgePoint.x);
    }
    else if(star.y > backgroundCanvas.height/2 && star.y > star.x){
        edgePoint.y = backgroundCanvas.height;
        edgePoint.x = determineX(slope, star, edgePoint.y);
    }
    else{
        edgePoint.x = backgroundCanvas.width;
        edgePoint.y = determineY(slope, star, edgePoint.x);
    }
    return edgePoint;
}

function pointsDistance(pointa, pointb) {
    return Math.sqrt((Math.pow((pointa.x - pointb.x), 2) + Math.pow((pointa.y - pointb.y), 2)))
}

function percentFromCenter(star) {
    var endpoint = calculateCanvasEdgePoint(star)
    return pointsDistance(this, center)/
    pointsDistance(center, endpoint);
}

function determineZone(star) {
    var percentDistance = percentFromCenter(star);
    for(var i = 1; i < zoneCount; i++){
        if(percentDistance < i/zoneCount){
            return i;
        }
    }
    return zoneCount;
}

function getRandNumInRange(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandDecimalInRange(min, max){
    return Math.random() * (max - min) + min;
}

function Star(x,y,l) {
	this.x = x;
	this.y = y;
    this.zone = determineZone({ x: this.x, y: this.y });
	this.length = getRandNumInRange(starSize.minLength * this.zone, starSize.maxLength * this.zone);
    this.alpha = 1;
    this.color = colors[Math.floor(Math.random() * colors.length)];
}

function calculateSlope(point, origin) {
    return typeof origin == 'undefined' ? (center.y - point.y) / (center.x - point.x) : (origin.y - point.y) / (origin.x - point.x);
}

function calculateEndPoint(m, point, centerX, centerY, distance, goRight) {
    var endPoint = {};
    
    // slope is 0
    if (m === 0) {
        endPoint.x = point.x > centerX ? point.x + distance : point.x - distance;
        endPoint.y = point.y;
    }
    // if slope is infinte
    else if (!isFinite(m)) {
        endPoint.x = point.x;
        endPoint.y = point.y > centerY ? point.y + distance : point.y - distance;
    }
    else {
        var dx = distance / Math.sqrt(1 + Math.pow(m, 2));
        var dy = m * dx;
    
        if(goRight){
            endPoint.x = point.x + dx;
            endPoint.y = point.y + dy;
        }
        else{
            endPoint.x = point.x - dx;
            endPoint.y = point.y - dy;
        }
    }
    
    return endPoint;
}

function calculateVectorEnd(star){
    var slope = calculateSlope(star);
    return calculateEndPoint(slope, star, 
        backgroundCanvas.width/2, backgroundCanvas.height/2, 
        star.length, star.x > backgroundCanvas.width/2);
}

function draw(star, endpoint){
    var starGradient = backgroundCtx.createLinearGradient(star.x, star.y, endpoint.x, endpoint.y);
    starGradient.addColorStop(0, "rgba(0, 0, 0, 0.000)");
    starGradient.addColorStop(0.5 ,star.color);
    starGradient.addColorStop(1, "rgba(0, 0, 0, 0.000)");
    backgroundCtx.beginPath();
    backgroundCtx.globalCompositeOperation = 'lighter';
    backgroundCtx.moveTo(star.x, star.y);
    backgroundCtx.lineTo(endpoint.x, endpoint.y);
    backgroundCtx.strokeStyle = starGradient;
    backgroundCtx.lineWidth = getRandNumInRange(starSize.minWidth * star.zone, 
        starSize.maxWidth * star.zone);
    backgroundCtx.stroke();
    backgroundCtx.closePath();
}

function drawStars(){
    for(var i = 0;i < starCount; i++){
        var x = Math.floor(Math.random() * backgroundCanvas.width);
        var y = Math.floor(Math.random() * backgroundCanvas.height);
        var star = new Star(x, y);
        var endpoint = calculateVectorEnd(star);
        draw(star, endpoint);
    }
}