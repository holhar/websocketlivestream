/*
 * Transcoding script
 * Copyright(c) 2016 Holger Harms <kontakt@hash-developer.de>
 * MIT Licensed
 */

// module dependencies
var fs = require('fs'),
    Logger = require('../../logger'),
    WebSocket = require('ws'),
    websocketlivestream = require('../../websocketlivestream');

// init objects
var logger = new Logger(),
    wsLivestream = new websocketlivestream();

// set CDN and server configuration
wsLivestream.initLoggingServerConnection(process.argv[2]);
wsLivestream.initTranscoder(process.argv[3]);

// init ws logger
var wsLogger = new WebSocket('ws://' + wsLivestream.wsLoggerUrl + ':' + wsLivestream.wsLoggerPort);

wsLogger.on('close', function close() {
  console.log('disconnected from loggingServer');
});

wsLogger.on('open', function open(ws)
{
    // init transcoder
    sendLog(logger.logTranscodingStartup(wsLivestream.name, wsLivestream.mpgSegmentPath, wsLivestream.mp4SegmentPath));

    // catch every new mpg-segment and transcode it to mp4
    fs.watch(
        wsLivestream.mpgSegmentPath,
        {
            persistent: true,
            interval: 1000
        },
        function(curr, prev)
        {
            wsLivestream.setupNextMpgTranscodingCycle();

            if(!wsLivestream.isTranscodingToMp4) {
                var segment = wsLivestream.transcodeToMp4();
                sendLog(logger.logTranscodingOfSegment(wsLivestream.name, segment));
            }
        }
    );

    // catch every new mp4-segment and transcode it to DASH
    fs.watch(
        wsLivestream.mp4SegmentPath,
        {
            persistent: true,
            interval: 1000
        },
        function(curr, prev)
        {
            wsLivestream.setupNextMp4TranscodingCycle();

            if(!wsLivestream.isTranscodingToDASH) {
                wsLivestream.transcodeToDASH();
            }
        }
    );
});

// functions
function sendLog(message)
{
    if(wsLogger.readyState === 1)
    {
        wsLogger.send(message, { binary: false, mask: true });
    }
}