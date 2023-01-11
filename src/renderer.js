const fs = require('fs');
const remote = require('electron');
const { PackrStream, UnpackrStream, unpack, pack } = require('msgpackr');

// Buttons
const startBtn = document.getElementById('startBtn');
startBtn.addEventListener('click', function () {
    console.log("button pressed");
    let fileData = fs.readFileSync('/Users/AnantGoyal/Library/CloudStorage/OneDrive-UBC/Documents/4th Year/SynapseRPC/comms');
    let decoded = unpack(fileData);
    console.log(decoded);
})
// startBtn.addEventListener('click', demo);

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// function demo() {
//     while(true) { 
//         let fileData = fs.readFileSync('/Users/AnantGoyal/Library/CloudStorage/OneDrive-UBC/Documents/4th Year/SynapseRPC/comms');
//         let decoded = unpack(fileData);
//         console.log(decoded);
//         await sleep(1000);
//     }
// }

// console.log("Running...");
// demo();