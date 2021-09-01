// Electron API
const { desktopCapturer, remote } = require('electron');
const { dialog, Menu } = remote;

// Node API
const { writeFile } = require('fs');

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];


// Get the available video sources
const getVideoSources = async () => {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
};

// Change the videoSource window to record
const selectSource = async (source) => {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    };

    // Create a Stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    // Preview the source in a video element
    videoElement.srcObject = stream;
    videoElement.play();

    // Create the Media Recorder
    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    // Register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
};

// Captures all recorded chunks
const handleDataAvailable = (event) => { recordedChunks.push(event.data); };

// Saves the video file on stop
const handleStop = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });
    const blobBuffer = await blob.arrayBuffer();

    const buffer = Buffer.from(blobBuffer);

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    if (filePath) writeFile(filePath, buffer, () => console.log('Video saved successfully!'));
};

// DOM Selection
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

// Event Handlers
startBtn.onclick = event => {
    if(startBtn.innerText != 'Recording') {
        mediaRecorder.start();
        startBtn.innerText = 'Recording';
    };
};

stopBtn.onclick = _event => {
    if(startBtn.innerText == 'Recording') {
        mediaRecorder.stop();
        startBtn.innerText = 'Start';
    };
};

videoSelectBtn.onclick = getVideoSources;