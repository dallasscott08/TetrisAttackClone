function getColorProperties (type){
    var colorProperties;
    switch (type) {
        case 0://Green
            colorProperties = {
                highlight: "#01F800",
                body:"rgba(1, 248, 0, 0.25)",
                //randomizedColor: pSettings.greenColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
        case 1://Purple
            colorProperties = {
                highlight: "#F818F8",
                body:"rgba(248, 22, 248, 0.25)",
                //randomizedColor: pSettings.purpleColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
        case 2://Red
            colorProperties = {
                highlight: "#F81010",
                body:"rgba(248, 18, 18, 0.25)",
                //randomizedColor: pSettings.redColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
        case 3://Yellow
            colorProperties = {
                highlight: "#F8F800",
                body:"rgba(248, 248, 0, 0.25)",
                //randomizedColor: pSettings.yellowColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
        case 4://Light Blue
            colorProperties = {
                highlight: "#01F8F8",
                body:"rgba(1, 248, 248, 0.25)",
                //randomizedColor: pSettings.lightBlueColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
        case 5://Dark Blue
            colorProperties = {
                highlight: "#4070F8",
                body:"rgba(63, 112, 248, 0.25)",
                //randomizedColor: pSettings.darkBlueColors[getRandNumInRange(0,pSettings.particleColorNum)]
            };
            break;
    }

    return colorProperties;
}

function buildParticleColorsArray(color){
    var colors = [color];
    for(var i = 0; i < pSettings.particleColorNum; i ++){
        colors.push(getRandomColor(color));
    }
    return colors;
}

function getRandomColor(color) {
    var p = 1,
        newColor,
        random = Math.random(),
        result = '#';

    while (p < color.length) {
        newColor = parseInt(color.slice(p, p += 2), 16)
        newColor += Math.floor((255 - newColor) * random);
        result += newColor.toString(16).padStart(2, '0');
    }
    return result;
}