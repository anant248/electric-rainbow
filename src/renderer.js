window.onload = function() {
    const counter = document.getElementById('counter');
    const playButton = document.querySelector('#boxes .play');
    const pauseButton = document.querySelector('#boxes .pause');
    
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
        
        // Render methods to be called each time data is recieved
        // TODO: update globally scoped object with more array elements
        changeParticle(rgbToHex(r, g, b), xCoordinate, yCoordinate);
        autoClick();
    })
    
    // TODO: remove if 'tap' event listener is not used
    window.human = true;

    var canvasEl = document.querySelector('.fireworks');
    var ctx = canvasEl.getContext('2d');
    var numberOfParticules = 30;
    var pointerX = 0;
    var pointerY = 0;
    var tap = ('ontouchstart' in window || navigator.msMaxTouchPoints) ? 'touchstart' : 'mousedown';

    var instrumentData = {}; // Globally scoped object
    var changeParticle = (newColor, newXCoordinate, newYCoordinate) => {
        instrumentData.color = newColor;
        instrumentData.x = newXCoordinate;
        instrumentData.y = newYCoordinate;
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

      }
      
      // TODO: remove if 'tap' event listener is not used
      function updateCoords(e) {
        pointerX = e.clientX || e.touches[0].clientX;
        pointerY = e.clientY || e.touches[0].clientY;
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
        // p.color = colors[anime.random(0, colors.length - 1)];
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
      function animateParticules(x, y, color) {
        var circle = createCircle(x, y, color);
        var particules = [];
        for (var i = 0; i < numberOfParticules; i++) {
          particules.push(createParticule(x, y, color));
        }

        var fireworkTimeline = new anime.timeline({ })
        
        fireworkTimeline
          .add({
            targets: particules,
            x: function(p) { return p.endPos.x; },
            y: function(p) { return p.endPos.y; },
            radius: 0.1,
            duration: anime.random(500, 25000),
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
        });

        // button handling
        pauseButton.addEventListener('click', function() {
            window.human = true;
            pauseAnimation(fireworkTimeline)
        }, false);

        // playButton.addEventListener('click', function() {
        //     window.human = false;
        //     fireworkTimeline.restart;
        //     autoClick();
        //     fireworkTimeline.play;
        // }, false);

        // playButton.onclick = fireworkTimeline.play;
        // pauseButton.onclick = fireworkTimeline.pause;
      }
      
      var render = anime({
        duration: Infinity,
        update: function() {
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        }
      });

      playButton.addEventListener('click', function() {
          window.human = false;
        //   autoClick();
        //   fireworkTimeline.play();
      }, false);

    //   pauseButton.addEventListener('click', function() {
    //     window.human = true;
    //     // fireworkTimeline.pause();
    //   }, false);

      function pauseAnimation(animation) {
          getTargets(animation).forEach(anime.remove);
        //   animation.restart();
      }

      function getTargets(animation) {
          return animation.children.reduce(
              (all, one) => all.concat(getTargets(one)),
              animation.animatables.map((a) => a.target)
          )
      }

    //   document.addEventListener(tap, function(e) {
    //     window.human = true;
    //     render.play();
    //     updateCoords(e);
    //     animateParticules(pointerX, pointerY);
    //   }, false);
      
      var centerX = window.innerWidth / 2;
      var centerY = window.innerHeight / 2;
      
      /* Simulates a click on the screen, which triggers the particle animation response
       * by calling animatePartcules
       */
      function autoClick() {
        if (window.human) return;
        animateParticules(instrumentData.x, instrumentData.y, instrumentData.color);
        // anime({duration: 200}).finished.then(autoClick);
    }
    
    // autoClick();
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize, false);
      
}
