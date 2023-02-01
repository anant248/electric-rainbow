window.onload = function() {
    const counter = document.getElementById('counter');
    const mainCanvas = document.getElementById('mainCanvas');
    
    /* 
     * This function is a callback to data being recieved on the raspberry-pi-data channel
     * 
     * _event: event to be executed when this function is called - the body of the function is the event
     * dataArray: an array of integers being received from the python client which is reading the raspberry pi
     */
    window.electronAPI.onUpdateUI((_event, dataArray) => {
        
        // updates the counter on the UI (dev)
        counter.innerText = dataArray
        
        // Store each element of input array into corresponding UI change task
        var r = dataArray[0];
        var g = dataArray[1];
        var b = dataArray[2];
        var xCoordinate = dataArray[3];
        var yCoordinate = dataArray[4];
        var pausePlayButton = dataArray[5];
        var clearButton = dataArray[6];
        var screenshotButton = dataArray[7];
        
        // Render methods to be called each time data is recieved
        changeParticle(rgbToHex(r, g, b), xCoordinate, yCoordinate, pausePlayButton, clearButton, screenshotButton);
        autoClick();
    })
    
    // flag that changes based on pause/play button
    // true when UI is paused, false otherwise
    window.human = true;

    var canvasEl = document.querySelector('.fireworks');
    var ctx = canvasEl.getContext('2d');
    var numberOfParticules = 30;

    var instrumentData = {}; // Globally scoped object
    var changeParticle = (newColor, newXCoordinate, newYCoordinate, newButton, newClear, newScreenshot) => {
        instrumentData.color = newColor;
        instrumentData.x = newXCoordinate;
        instrumentData.y = newYCoordinate;
        instrumentData.button = newButton;
        instrumentData.clearButton = newClear;
        instrumentData.screenshotButton = newScreenshot;
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

      /* Sets initial HTML canvas element properties */
      function setCanvasSize() {
        canvasEl.width = window.innerWidth * 2;
        canvasEl.height = window.innerHeight * 2;
        canvasEl.style.width = window.innerWidth + 'px';
        canvasEl.style.height = window.innerHeight + 'px';
        canvasEl.getContext('2d').scale(2, 2);
        // ctx.fillStyle = "black";
        // ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
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
       * anim: ...
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
      function animateParticules(x, y, color, pausePlayButton, clearButton) {
        var circle = createCircle(x, y, color);
        var particules = [];
        for (var i = 0; i < numberOfParticules; i++) {
          particules.push(createParticule(x, y, color));
        }

        var fireworkTimeline = new anime.timeline({ })
        
        fireworkTimeline
          // .add({
          //   targets: particules,
          //   x: function(p) { return p.endPos.x; },
          //   y: function(p) { return p.endPos.y; },
          //   radius: 0.1,
          //   duration: anime.random(500, 2000),
          //   easing: 'easeOutExpo',
          //   update: renderParticule
          // })
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

        // button handling: each time animation is called, check the status of the buttons
        fireworkTimeline.finished.then(checkButtons(fireworkTimeline, pausePlayButton, clearButton));
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

        if (clearButton == 0) { // clear canvas - this instance only gets triggered if canvas is cleared while UI is playing
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
        if (instrumentData.button == 0 && instrumentData.clearButton == 0) {
          console.log("Clearing Canvas now: ", instrumentData.clearButton);
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }

        // take screenshot if screenshot button is 0
        if (instrumentData.screenshotButton == 0) {
          takeScreenshot();
          console.log("Screenshot taken!")
        }

        // if flag is true (UI is paused), do nothing within autoClick()
        // else flag is false (UI is playing), animateParticules()
        if (window.human) return;
        else animateParticules(instrumentData.x, instrumentData.y, instrumentData.color, instrumentData.button, instrumentData.clearButton);
    }
    
    // initialize canvas
    setCanvasSize();
    // event listener for resizing window
    window.addEventListener('resize', setCanvasSize, false);
}