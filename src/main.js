const fs = require('fs');
const path = require('path');
const net = require('net');

const { unpack } = require('msgpackr');
const { app, BrowserWindow, ipcMain } = require('electron');

// Disable chromium security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const createWindow = () => {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js') // preload IPC file containing electronAPI
        }
    });

    // and load the index.html of the app
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // open the DevTools
    mainWindow.webContents.openDevTools();

    // maximize the main window
    mainWindow.maximize();
    // mainWindow.setFullScreen(true);
};

// this method will be called when electron has finished initialization and is ready to create browser windows
// some API's can only be used after this event occurs
app.whenReady().then(() => {
    createWindow();
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
    // On OS X it is common for applications to stay active until the user quits, explicitly
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

console.log("Trying to create a TCP server");

const server = net.createServer((socket) => {
    console.log('client connected');

    // Disconnect client when socket connection ends
    socket.on('end', () => {
        console.log('client disconnected');
    });
    
    // Send data to renderer process when data is recived on the socket
    socket.on('data', (data) => {
        try {
            let decoded = unpack(data); // decode recieved data
            console.log(decoded); // log decoded data to node terminal

            const mainWindow = BrowserWindow.fromId(1);
            mainWindow.webContents.send('raspberry-pi-data', decoded);
        } catch (err) {
            // Try again if buffer end not found (race condition)
            console.log("read fail...");
        }
        
    });
});

// Listen on 'localhost'
server.listen(9000, "127.0.0.1", () => {
  console.log('server bound');
});

server.on('error', (err) => {
  throw err;
});

// Listen for IPC between renderer and main
ipcMain.on("send-image", (event, image) => {
    var base64Str = image;
    
    var data = base64Str.replace(/^data:image\/\w+;base64,/, "");
    var buf = Buffer.from(data, "base64");
    fs.writeFile("./data/image.png", buf, (err) => {
        if (err) console.log(err);
        else {
            console.log("File written successfully\n");
        }
    });
});