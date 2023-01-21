const fs = require('fs');
const path = require('path');
const net = require('net');

const { unpack } = require('msgpackr');
const { app, BrowserWindow } = require('electron');

const createWindow = () => {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
            mainWindow.webContents.send('update-counter', decoded);
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