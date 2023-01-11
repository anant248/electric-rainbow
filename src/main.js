const fs = require('fs');
const { PackrStream, UnpackrStream, unpack, pack } = require('msgpackr');
const electron = require('electron')
const path = require('path')

const { app, BrowserWindow } = electron

const createWindow = () => {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    // and load the index.html of the app
    mainWindow.loadFile(path.join(__dirname, 'index.html'))

    // open the DevTools
    mainWindow.webContents.openDevTools();
};

// this method will be called when electron has finished initialization and is ready to create browser windows
// some API's can only be used after this event occurs
app.on('ready', createWindow);

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
    while(true) { 
        let fileData = fs.readFileSync('/Users/AnantGoyal/Library/CloudStorage/OneDrive-UBC/Documents/4th Year/SynapseRPC/comms');
        let decoded = unpack(fileData);
        console.log(decoded);
        await sleep(1000);
    }
}

console.log("Running...");
demo();