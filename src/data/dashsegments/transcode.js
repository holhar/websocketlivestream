var fs = require('fs'),
    WebSocketLivestream = require('../../WebSocketLivestream'),
    logger = require('../../logger');

wsLivestream = new WebSocketLivestream();
wsLivestream.initTranscoder('../webcamstream/', '../mp4segments/', './');
logger.logTranscodingStartup(wsLivestream.webcamStreamPath, wsLivestream.mp4SegmentsPath);

// catch every new mpg-segment and transcode it to mp4
fs.watch(
    wsLivestream.webcamStreamPath,
    {
        persistent: true,
        interval: 1000
    },
    function(curr, prev)
    {
        wsLivestream.setupNextMpgTranscodingCycle();

        if(!wsLivestream.isTranscodingToMp4) {
            wsLivestream.transcodeToMp4();
        }
    }
);

// catch every new mp4-segment and transcode it to DASH
fs.watch(
    wsLivestream.mp4SegmentsPath,
    {
        persistent: true,
        interval: 1000
    },
    function(curr, prev)
    {
        wsLivestream.transcodeNextMp4Segment();
        wsLivestream.transcodeToDASH();
    }
);