//import html2canvas from "C:Users/rassa/Documents/igen430/electric-rainbow/node_modules/html2canvas/dist/html2canvas.js";

class Queue {
  constructor() {
    this.elements = {};
    this.head = 0;
    this.tail = 0;
  }
  enqueue(element) {
    this.elements[this.tail] = element;
    this.tail++;
  }
  dequeue() {
    const item = this.elements[this.head];
    delete this.elements[this.head];
    this.head++;
    return item;
  }
  peek() {
    return this.elements[this.head];
  }
  get length() {
    return this.tail - this.head;
  }
  get isEmpty() {
    return this.length === 0;
  }
  get itemsAsArray() {
    var somethingArr = new Array();

    for (let i = this.head; i < this.tail; i++) {
      somethingArr.push(this.elements[i]);
    }

    return somethingArr;
  }
  get items() {
    return this.elements;
  }
}



let btnStatus = 0;
const mainCanvas = document.getElementById("mainCanvas");
const btnIcon = document.getElementById("btnIcon");
const PLAY_ICON_CLASS = "fa fa-play-circle";
const PAUSE_ICON_CLASS = "fa fa-pause-circle";

window.onload = function () {
  /*
   * This function is a callback to data being recieved on the raspberry-pi-data channel
   *
   * _event: event to be executed when this function is called - the body of the function is the event
   * dataArray: an array of integers being received from the python client which is reading the raspberry pi
   */
  window.electronAPI.onUpdateUI((_event, dataArray) => {
    // updates the counter on the UI (dev)
    counter.innerText = dataArray;

    // Store each element of input array into corresponding UI change task
    var r = dataArray[0];
    var g = dataArray[1];
    var b = dataArray[2];
    var xCoordinate = dataArray[3];
    var yCoordinate = dataArray[4];
    var screenshotButton = dataArray[5];
    var clearButton = dataArray[6];

    // Render methods to be called each time data is recieved
    changeParticle(
      rgbToHex(r, g, b),
      xCoordinate,
      yCoordinate,
      screenshotButton,
      clearButton
    );
    autoClick();
  });

  // Adding the takeScreenshot function as event handler for the screenshot button
  // We must add the await keyword here again because the function was not returning the desired
  // screenshot fast enough, so base64Image was undefined (see notes in the takeScreenshot() function)
  document.getElementById("screenshotBtn").addEventListener(
    "click",
    async () => {
      if ( btnStatus == 0){
        btnStatus = 1;
        let tempArray = await takeScreenshot();
        const base64Image = tempArray[0];
        let newCanvas = tempArray[1]
        replaceMainCanvas(newCanvas);
        document.getElementById("btn-icon").className = PLAY_ICON_CLASS;
        window.electronAPI.sendImage(base64Image);
      } else if (btnStatus == 1){
        let newCanvas = document.getElementById("newCanvas");
        newCanvas.remove();
        //mainCanvas = document.getElementById("mainCanvas");
        mainCanvas.style.display = "block";
        btnStatus = 0;
        document.getElementById("btn-icon").className = PAUSE_ICON_CLASS;

      }
    },
    false
  );

  function replaceMainCanvas(newCanvas){
    //mainCanvas = document.getElementById("mainCanvas");
    // Giving Canvas an id
    newCanvas.id = "newCanvas";
    // Add the new canvas to the same parent element as the screenshot canvas
    mainCanvas.parentNode.insertBefore(newCanvas, mainCanvas);
    // Hide the screenshot canvas by setting its display style to "none"
    mainCanvas.style.display = "none";
    // You can restore the original canvas by setting its display style back to "block"
  }

  // flag that changes based on pause/play button
  // true when UI is paused, false otherwise
  window.human = true;

  var canvasEl = document.querySelector(".fireworks");
  var ctx = canvasEl.getContext("2d");
  var numberOfParticules = 30;

  var instrumentData = {}; // Globally scoped object
  var changeParticle = (
    newColor,
    newXCoordinate,
    newYCoordinate,
    newButton,
    newClear
  ) => {
    instrumentData.color = newColor;
    instrumentData.x = newXCoordinate;
    instrumentData.y = newYCoordinate;
    instrumentData.button = newButton;
    instrumentData.clearButton = newClear;
  };

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
    canvasEl.style.width = window.innerWidth + "px";
    canvasEl.style.height = window.innerHeight + "px";
    canvasEl.getContext("2d").scale(2, 2);
  }

  /* Sets size and direction of particle on canvas */
  function setParticuleDirection(p) {
    var angle = (anime.random(0, 360) * Math.PI) / 180;
    var value = anime.random(50, 180);
    var radius = [-1, 1][anime.random(0, 1)] * value;
    return {
      x: p.x + radius * Math.cos(angle),
      y: p.y + radius * Math.sin(angle),
    };
  }

  /* Generates particle properties. p is the particle object
   *
   * x: x coordinate of particle on canvas. This properties is affected by recieved input data
   * y: y coordinate of particle on canvas. This properties is affected by recieved input data
   * color: color of particle on canvas. This properties is affected by recieved input data
   */
  function createParticule(x, y, color) {
    var p = {};
    p.x = x;
    p.y = y;
    p.color = color;
    p.radius = anime.random(16, 32);
    p.endPos = setParticuleDirection(p);
    p.draw = function () {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.fillStyle = p.color;
      ctx.fill();
    };
    return p;
  }

  /* Generates circle properties. p is the circle object
   *
   * x: x coordinate of circle on canvas
   * y: y coordinate of circle on canvas
   * color: color of circle on canvas
   */
  function createCircle(x, y, color) {
    var p = {};
    p.x = x;
    p.y = y;
    p.color = color;
    p.radius = 0.1;
    p.alpha = 0.5;
    p.lineWidth = 6;
    p.draw = function () {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
      ctx.lineWidth = p.lineWidth;
      ctx.strokeStyle = p.color;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
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

  // Helper variables to hold the necessary timeline objects to generate a screenshot
  var screenshotBufferSize = 100;
  var timelineQueue = new Queue();

  /* Animates the static particle object and circle objects
   *
   * x: x coordinate of particle on canvas. This properties is affected by recieved input data
   * y: y coordinate of particle on canvas. This properties is affected by recieved input data
   */
  function animateParticules(x, y, color, screenshotButton, clearButton) {
    var circle = createCircle(x, y, color);
    var particules = [];
    for (var i = 0; i < numberOfParticules; i++) {
      particules.push(createParticule(x, y, color));
    }

    var fireworkTimeline = anime.timeline();

    fireworkTimeline.add({
      targets: particules,
      x: function (p) {
        return p.endPos.x;
      },
      y: function (p) {
        return p.endPos.y;
      },
      radius: 0.1,
      duration: anime.random(500, 25000),
      easing: "easeOutExpo",
      update: renderParticule,
    });
    //   .add({
    //   targets: circle,
    //   radius: anime.random(80, 160),
    //   lineWidth: 0,
    //   alpha: {
    //     value: 0,
    //     easing: 'linear',
    //     duration: anime.random(600, 800),
    //   },
    //   duration: anime.random(1200, 1800),
    //   easing: 'easeOutExpo',
    //   update: renderParticule,
    //   offset: 0
    // });

    // Save the timeline object in the Queue for screenshot generation
    if (timelineQueue.length >= screenshotBufferSize) {
      timelineQueue.dequeue();
    }
    timelineQueue.enqueue(fireworkTimeline);

    // button handling: each time animation is called, check the status of the buttons
    //fireworkTimeline.finished.then(takeScreenshot(screenshotButton, clearButton));
  }
  /* Checks the status of the pause/play and clear button
   *
   * screenshotBtn: flips between 0 and 1, 0 indicating animation is playing and 1 indicating animation is paused
   * clearButton: flips between 0 and 1, 0 indicating do not clear canvas and 1 indicating clear canvas
   */
  async function takeScreenshot() {
    const screenshotTarget = document.getElementById("mainCanvas");

    // This function originally looked like the commented out code below. However this
    // was not working and returned undefined because the code kept running and the return
    // value of the asyncronous html2canvas function was not stored in the variable before
    // it was sent to main.js. this was fixed by adding the await keyword before html2canvas
    // to make sure that a value was returned before moving on to the next line of code. This
    // necessitated that we make takescreenshot() asyncronous as well (instead of using then)
    const newCanvas = await html2canvas(screenshotTarget);

    const base64image = newCanvas.toDataURL("image/png");

    // html2canvas(screenshotTarget).then((canvas) => {
    //   base64image = canvas.toDataURL("image/png");
    //   // test1 = base64image;
    //   // let a = document.createElement("a"); //Create <a>
    //   // a.href = "data:image/png;base64," + base64image; //Image Base64 Goes here
    //   // a.download = "Image.png"; //File name Here
    //   // a.click(); //Downloaded file
    //   // window.location.href = base64image;
    //   return base64image;
    // });
    return [base64image, newCanvas];
  
  
    

    // if (screenshotBtn == 1) { // paused
    //     console.log("Animation is currently paused " + screenshotBtn);
    //     window.human = true;

    //     // Replay the buffered timeline objs

    //     for (let i = 0; i < timelineArr.length; i++) {
    //         const element = timelineArr[i];
    //         element.restart();
    //     }
    // }
    // else if (screenshotBtn == 0) { // playing
    //     console.log("Animation is currently playing " + screenshotBtn);
    //     window.human = false;
    // }

    // This is commented out to implement screenshot button instead of pause/play/clear
    // if (clearButton == 1) { // clear canvas - this instance only gets triggered if canvas is cleared while UI is playing
    //     console.log("Clearing Canvas now: ", clearButton);
    //     ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    // }
  }

  var render = anime({
    duration: Infinity,
    update: function () {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    },
  });

  /* Simulates a click on the screen, which triggers the particle animation response
   * by calling animatePartcules
   */
  function autoClick() {
    // switch flag to false when UI is playing
    if (instrumentData.button == 0) window.human = false;

    // This was commented out to implement screenshot button instead
    // clear canvas if UI is paused
    // if (instrumentData.button == 1 && instrumentData.clearButton == 1) {
    //   console.log("Clearing Canvas now: ", instrumentData.clearButton);
    //   ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    // }

    // if flag is true (UI is paused), do nothing within autoClick()
    // else flag is false (UI is playing), animateParticules()
    if (window.human) return;
    else
      animateParticules(
        instrumentData.x,
        instrumentData.y,
        instrumentData.color,
        instrumentData.button,
        instrumentData.clearButton
      );
  }

  // initialize canvas
  setCanvasSize();
  // event listener for resizing window
  window.addEventListener("resize", setCanvasSize, false);
};

// // call this function when the page/dom is ready for it
// document.querySelector(document).ready(function() {

//             // Global variable
//             var element = document.querySelector("#html-content-holder");

//             // Global variable
//             var getCanvas;

//             document.querySelector("#btn-Preview-Image").addEventListener('click', function() {
//                 html2canvas(element, {
//                     onrendered: function(canvas) {
//                         document.querySelector("#previewImage").insertAdjacentHTML("beforeend",canvas);
//                         getCanvas = canvas;
//                     }
//                 });
//             });

//             document.querySelector("#btn-Convert-Html2Image").addEventListener('click', function() {
//                 var imgageData =
//                     getCanvas.toDataURL("image/png");

//                 // Now browser starts downloading
//                 // it instead of just showing it
//                 var newData = imgageData.replace(
//                 /^data:image/png/, "data:application/octet-stream");

//                 document.querySelector("#btn-Convert-Html2Image").attr(
//                 "download", "GeeksForGeeks.png").attr(
//                 "href", newData);
//             });
//         });
