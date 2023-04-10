window.onload = function() {
    const mainCanvas = document.getElementById('mainCanvas');
    
    /* 
     * This function is a callback to data being recieved on the raspberry-pi-data channel
     * 
     * _event: event to be executed when this function is called - the body of the function is the event
     * dataArray: an array of integers being received from the python client which is reading the raspberry pi
     */
    window.electronAPI.onUpdateUI((_event, dataArray) => {
        
        // Store each element of input array into corresponding UI change task
        var r = dataArray[0];
        var g = dataArray[1];
        var b = dataArray[2];
        var xCoordinate = dataArray[3] * window.innerWidth * 2;
        var yCoordinate = dataArray[4] * window.innerHeight * 2;
        var pausePlayButton = dataArray[5];
        var clearButton = dataArray[6];
        var screenshotButton = dataArray[7];
        var animationMode1 = dataArray[8];
        var animationMode2 = dataArray[9];
        var grayscale = dataArray[10];
        var fullOutput = dataArray[11];
        
        var animationColor = grayscale ? rgbToHex(fullOutput, fullOutput, fullOutput) : rgbToHex(r, g, b);

        // Render methods to be called each time data is recieved
        changeParticle(animationColor, xCoordinate, yCoordinate, pausePlayButton, clearButton, screenshotButton, animationMode1, animationMode2, grayscale);
        autoClick();
    })
    
    // flag that changes based on pause/play button
    // true when UI is paused, false otherwise
    window.human = true;

    // flag specifically for rgb difference animation
    // true when difference between previous rgb and current rgb is greater than 10
    window.renderRgbDifference = true;

    // flag for background color - true if background is black, false otherwise
    window.blackBackground = false;

    var canvasEl = document.querySelector('.fireworks');
    var ctx = canvasEl.getContext('2d');
    var numberOfParticules = 30;

    // store previous rgb values
    var lastr = 255
    var lastg = 255
    var lastb = 255

    var instrumentData = {}; // Globally scoped object
    var changeParticle = (newColor, newXCoordinate, newYCoordinate, newButton, newClear, newScreenshot, newAnimationMode1, newAnimationMode2, newGrayscale) => {
        instrumentData.color = newColor;
        instrumentData.x = newXCoordinate;
        instrumentData.y = newYCoordinate;
        instrumentData.button = newButton;
        instrumentData.clearButton = newClear;
        instrumentData.screenshotButton = newScreenshot;
        instrumentData.animationMode1 = newAnimationMode1;
        instrumentData.animationMode2 = newAnimationMode2;
        instrumentData.grayscale = newGrayscale;
    }
    
    /* Helper function to rgbToHex */
    function componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    
    /*
     * Converts rgb values to a hex code needed for animation color properties
     * 
     * r, g, b: integer values representing rgb numbers
     * returns string of hex color code
     */
    function rgbToHex(r, g, b) {
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    /*
     * Converts hex code to a rgb values needed for animation color properties
     * 
     * hex: string representing a color
     * returns string of rgb value
     * return hexToRgb("#hexvalue").r returns the r value
     */
    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

      /* Sets initial HTML canvas element properties */
      function setCanvasSize() {
        canvasEl.width = window.innerWidth * 2;
        canvasEl.height = window.innerHeight * 2;
        canvasEl.style.width = window.innerWidth + 'px';
        canvasEl.style.height = window.innerHeight + 'px';
        canvasEl.getContext('2d').scale(2, 2);
      }
      
      /* Sets size and direction of particle on canvas */
      function setParticuleDirection(p) {
        var angle = anime.random(0, 360) * Math.PI / 180;
        var value = anime.random(50, 180);
        var radius = [-1, 1][anime.random(0, 1)] * value;
        return {
          x: p.x + radius * Math.cos(angle),
          y: p.y + radius * Math.sin(angle)
        }
      }
      
      /* Generates particle properties. p is the particle object
       * 
       * x: x coordinate of particle on canvas. This properties is affected by recieved input data
       * y: y coordinate of particle on canvas. This properties is affected by recieved input data
       * color: color of particle on canvas. This properties is affected by recieved input data
       */
      function createParticule(x,y,color) {
        var p = {};
        p.x = x;
        p.y = y;
        p.color = color;
        p.radius = anime.random(16, 32);
        p.endPos = setParticuleDirection(p);
        p.draw = function() {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
        return p;
      }
      
      /* Generates circle properties. p is the circle object
       * 
       * x: x coordinate of circle on canvas
       * y: y coordinate of circle on canvas
       * color: color of circle on canvas
       */
      function createCircle(x,y,color) {
        var p = {};
        p.x = x;
        p.y = y;
        p.color = color;
        p.radius = 0.1;
        p.alpha = .5;
        p.lineWidth = 6;
        p.draw = function() {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
          ctx.lineWidth = p.lineWidth;
          ctx.strokeStyle = p.color;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        return p;
      }
      
      /* Renders the static particle object
       * 
       * anim: the object that stores elements to be drawn
       * Called as an update method to each firework timeline
       */
      function renderParticule(anim) {
        for (var i = 0; i < anim.animatables.length; i++) {
          anim.animatables[i].target.draw();
        }
      }
      
      /* Animates the static particle object and circle objects
       * 
       * x: x coordinate of particle on canvas. This properties is affected by recieved input data
       * y: y coordinate of particle on canvas. This properties is affected by recieved input data
       */
      function animateParticules(x, y, color, pausePlayButton, clearButton, animationMode1, animationMode2) {
        var circle = createCircle(x, y, color);
        var particules = [];
        for (var i = 0; i < numberOfParticules; i++) {
          particules.push(createParticule(x, y, color));
        }

        var fireworkTimeline = new anime.timeline({ });

        // if difference between last data and current data does not meet threshold, don't render animations
        // but continue to check the buttons, else render animations and check buttons
        if (!window.renderRgbDifference) {
          checkButtons(fireworkTimeline, pausePlayButton, clearButton);
        }
        else {
          if (animationMode1 && animationMode2) { // spiky gui mode
            // if canvas background is black switch to white, else do nothing
            if (window.blackBackground) {
              ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
              window.blackBackground = false;
            }

            fireworkTimeline
              .add({
                targets: particules,
                x: function(p) { return p.endPos.x; },
                y: function(p) { return p.endPos.y; },
                radius: 0.1,
                duration: anime.random(500, 2000),
                easing: 'easeOutExpo',
                update: renderParticule
              });
          }
          else if (animationMode1 && !animationMode2) { // circly gui
            // if canvas background is black switch to white, else do nothing
            if (window.blackBackground) {
              ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
              window.blackBackground = false;
            }

            fireworkTimeline
              .add({
                targets: circle,
                radius: anime.random(80, 160),
                lineWidth: 0,
                alpha: {
                  value: 0,
                  easing: 'linear',
                  duration: anime.random(600, 800),  
                },
                duration: anime.random(1200, 1800),
                easing: 'easeOutExpo',
                update: renderParticule,
                offset: 0
              });
          }
          else { // jamming mode
            fireworkTimeline
              .add({
                targets: particules,
                x: function(p) { return p.endPos.x; },
                y: function(p) { return p.endPos.y; },
                radius: 0.1,
                duration: anime.random(500, 2000),
                easing: 'easeOutExpo',
                update: renderParticule
              })
              .add({
                targets: circle,
                radius: anime.random(80, 160),
                lineWidth: 0,
                alpha: {
                  value: 0,
                  easing: 'linear',
                  duration: anime.random(600, 800),  
                },
                duration: anime.random(1200, 1800),
                easing: 'easeOutExpo',
                update: renderParticule,
                offset: 0
              })
              .add({
                duration: 200,
                update: function() {
                  ctx.fillStyle = "black";
                  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
                  window.blackBackground = true;
                }
              });
          }
        
          // button handling: each time animation is called, check the status of the buttons
          fireworkTimeline.finished.then(checkButtons(fireworkTimeline, pausePlayButton, clearButton));
        }
      }

      /* Checks the status of the pause/play and clear button
       * 
       * animation: the animation timeline to be paused or played
       * pauseButton: flips between 0 and 1, 0 indicating animation is playing and 1 indicating animation is paused
       * clearButton: flips between 0 and 1, 0 indicating do not clear canvas and 1 indicating clear canvas
       */
      function checkButtons(animation, pauseButton, clearButton) {
        if (pauseButton == 0) { // paused
          console.log("Animation is currently paused " + pauseButton);
          window.human = true;
          pauseAnimation(animation);
        }
        else if (pauseButton == 1) { // playing
            console.log("Animation is currently playing " + pauseButton);
            window.human = false;
        }

        if (clearButton == 1) { // clear canvas - this instance only gets triggered if canvas is cleared while UI is playing
            console.log("Clearing Canvas now: ", clearButton);
            ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
    }

      /* Helper function to pauseAnimation */
      function getTargets(animation) {
          return animation.children.reduce(
              (all, one) => all.concat(getTargets(one)),
              animation.animatables.map((a) => a.target)
          )
      }

      /* pauses the current onscreen animation by removing all active canvas elements from animation timeline
       * method used by checkButtons()
       *
       * animation: the animation timeline containing the elements needing to be removed
       */
      function pauseAnimation(animation) {
          getTargets(animation).forEach(anime.remove);
      }

      /* 
       * takes a screenshot of current canvas and sends it to the main process to be saved as a png in local folder
       * TODO: implement screenshot functionality
       */
      async function takeScreenshot() {
        const newCanvas = await html2canvas(mainCanvas);
        const base64image = newCanvas.toDataURL("image/png");

        window.electronAPI.sendImage(base64image);
      }


      /* Simulates a click on the screen, which triggers the particle animation response
       * by calling animatePartcules
       */
      function autoClick() {
        // switch flag to false when UI is playing
        if (instrumentData.button == 1) window.human = false;

        // clear canvas if UI is paused
        if (instrumentData.button == 0 && instrumentData.clearButton == 1) {
          console.log("Clearing Canvas now: ", instrumentData.clearButton);
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }

        // take screenshot if screenshot button is 0
        if (instrumentData.screenshotButton == 0) {
          // takeScreenshot();
          console.log("Screenshot taken!")
        }

        // if flag is true (UI is paused) or color is white (nothing is being played), do nothing within autoClick()
        // else flag is false (UI is playing), animateParticules()
        let r = hexToRgb(instrumentData.color).r
        let g = hexToRgb(instrumentData.color).g
        let b = hexToRgb(instrumentData.color).b

        // check if previous rgb is different enough from current rgb
        const rgbThresholdDifference = 20
        const midDifference = 30 // since mids are dominant, we use a greater mid difference

        if (Math.abs(lastr - r) > rgbThresholdDifference || Math.abs(lastg - g) > midDifference || Math.abs(lastb - b) > rgbThresholdDifference) {
          window.renderRgbDifference = true;
        }
        else {
          window.renderRgbDifference = false;
        }

        if (window.human || ((r > 250 && g > 250 && b > 250) && instrumentData.clearButton != 1)) return;
        else animateParticules(instrumentData.x, instrumentData.y, instrumentData.color, instrumentData.button, 
                               instrumentData.clearButton, instrumentData.animationMode1, instrumentData.animationMode2);
    }
    
    // initialize canvas
    setCanvasSize();
    // event listener for resizing window
    window.addEventListener('resize', setCanvasSize, false);
}