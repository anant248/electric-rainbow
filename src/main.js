const fs = require("fs");
const path = require("path");
const net = require("net");
var base64ToImage = require("base64-to-image");
const DATA_PATH = "C:Users/rassa/Documents/igen430/electric-rainbow/data";

const { unpack } = require("msgpackr");
const { app, BrowserWindow, ipcMain } = require("electron");

// Disable chromium security warnings
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const createWindow = () => {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, "preload.js"), // preload IPC file containing electronAPI
    },
  });

  // and load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // open the DevTools
  mainWindow.webContents.openDevTools();

  // this was taken from the example here : https://www.electronjs.org/docs/latest/tutorial/ipc#ipc-channels
  // it handles the sent screenshot(base64image string) from render.js turns it to an
  // image using the base64toimage package and downloads it to the data folder...
  // **turns out that the base64image package turns it into an imageInfo object (node), I couldn't figure out 
  // how to download this so Ijust used the fs.writeFile on the base64 string and it worked!
  ipcMain.on("send-image", (event, image) => {
    const webContents = event.sender;
    // we don't need to use console.log to debug, you can debug in vs code:
    // click on the left side of the line of code to add break points
    // run npm start
    // then go to main.js and click run -> start debugging
    // use the node debugger, the local variables should appear on the left panel of vs

    //console.log(image);
    var base64Str = image;
    var path = DATA_PATH;
    //var optionalObj = {'fileName': 'imageFileName', 'type':'png'};
    // by default the file name is "Img" + current date string, and type is png

    //base64ToImage(base64Str, path);

    //Note base64ToImage function returns imageInfo which is an object with imageType and fileName.
    //var imageInfo = base64ToImage(base64Str, path); //,optionalObj);\\don't knmow how to save this?
    var data = base64Str.replace(/^data:image\/\w+;base64,/, "");
    var buf = Buffer.from(data, "base64");
    let currentDate = new Date().toISOString()
    let fileName = "img" + currentDate.replace(/:/g, "") + ".png";
    fs.writeFile("./data/" + fileName, buf, (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    });
  });
};

// this method will be called when electron has finished initialization and is ready to create browser windows
// some API's can only be used after this event occurs
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // On OS X it is common for applications to stay active until the user quits, explicitly
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

console.log("Trying to create a TCP server");

const server = net.createServer((socket) => {
  console.log("client connected");

  // Disconnect client when socket connection ends
  socket.on("end", () => {
    console.log("client disconnected");
  });

  // Send data to renderer process when data is recived on the socket
  socket.on("data", (data) => {
    try {
      let decoded = unpack(data); // decode recieved data
      console.log(decoded); // log decoded data to node terminal

      const mainWindow = BrowserWindow.fromId(1);
      mainWindow.webContents.send("raspberry-pi-data", decoded);
    } catch (err) {
      // Try again if buffer end not found (race condition)
      console.log("read fail...");
    }
  });
});

// Listen on 'localhost'
server.listen(9000, "127.0.0.1", () => {
  console.log("server bound");
});

server.on("error", (err) => {
  throw err;
});
