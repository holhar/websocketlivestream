(function()
{
'use strict';

/*!
 * websocketlivestream: utilities for video livestream over websockets
 * Copyright(c) 2016 Holger Harms <kontakt@hash-developer.de>
 * MIT Licensed
 */

var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    config = require('./config'),
    ffmpeg = require('fluent-ffmpeg');

/**
 * WebSocket Livestream object
 *
 * @constructor
 * @api public
 */
function websocketlivestream()
{
    this.name = '';

    this.sockets = [];
    this.mpgSegmentQueue = [];
    this.mp4SegmentQueue = [];
    this.broadcastQueue = [];

    this.isTranscodingToMp4 = false;
    this.isTranscodingToDASH = false;
    this.isBroadcasting = false;
    this.doBroadcasting = false;
    this.lastBroadcastElement = '';

    this.webcamStreamPath = '';
    this.mp4SegmentsPath = '';
    this.dashSegmentsPath = '';

    this.receiveCount = 0;
    this.sendCount = 0;

    this.wssUrl = '';
    this.wssPort = '';
    this.wsUrl = '';
    this.wsPort = '';
    this.wsLoggerUrl = '';
    this.wsLoggerPort = '';
}

/**
 * Adds new socket connection to queue
 *
 * @param {Object} socket-connection that has been initiated
 * @api public
 */
websocketlivestream.prototype.addSocket = function(socket)
{
    this.sockets.push(socket);
};

/**
 * Removes socket connection from queue
 *
 * @param {Object} socket-connection to be removed
 * @api public
 */
websocketlivestream.prototype.removeSocket = function(socket)
{
    var index = this.sockets.indexOf(socket);
    this.sockets.splice(index, 1);
};

/**
 * Adds a new mp4 segment to the mp4 segment queue
 *
 * @param {String} the new mp4 segment to be added
 * @api public
 */
websocketlivestream.prototype.addNewSegmentToMpgSegmentQueue = function(newSegment)
{
    for(var i=0, max = this.mpgSegmentQueue.length; i < max; i++) {
        if(this.mpgSegmentQueue[i] === newSegment)
            return;
    }

    this.mpgSegmentQueue.push(newSegment);
    return;
};

/**
 * Adds a new dash segment to the dash segment queue
 *
 * @param {String} the new dash segment to be added
 * @api public
 */
websocketlivestream.prototype.addNewSegmentToMp4SegmentQueue = function(newSegment)
{
    for(var i=0, max = this.mp4SegmentQueue.length; i < max; i++) {
        if(this.mp4SegmentQueue[i] === newSegment)
            return;
    }

    this.mp4SegmentQueue.push(newSegment);
    return;
};

/**
 * Adds a new dash segment to the dash segment queue
 *
 * @param {String} the new dash segment to be added
 * @api public
 */
websocketlivestream.prototype.addNewSegmentToBroadcastQueue = function(newSegment)
{
    for(var i=0, max = this.broadcastQueue.length; i < max; i++) {
        if(this.broadcastQueue[i] === newSegment)
            return;
    }

    this.broadcastQueue.push(newSegment);
    return;
};

/**
 * Removes the first segment in line
 *
 * @param {Array} the queue from which the segment shall be removed
 * @api public
 */
websocketlivestream.prototype.removeFirstSegmentInArray = function(queue)
{
    switch(queue)
    {
    case('mpgSegmentQueue'):
        this.mpgSegmentQueue.shift();
        break;
    case('mp4SegmentQueue'):
        this.mp4SegmentQueue.shift();
        break;
    case('broadcastQueue'):
        this.broadcastQueue.shift();
        break;
    }
};

/**
 * Sets the recently send segment equal to the first element in line
 *
 * @api public
 */
websocketlivestream.prototype.updateLastBroadcastElement = function()
{
    this.lastBroadcastElement = this.broadcastQueue[0];
};

/**
 * Adds a new mpg segment to the mpg segment queue
 *
 * @api public
 */
websocketlivestream.prototype.setupNextMpgTranscodingCycle = function()
{
    var mostRecentMpgFile = this.getMostRecentFile(this.webcamStreamPath, /webcam_part\d+\.mpg/i);
    this.addNewSegmentToMpgSegmentQueue(mostRecentMpgFile);
};

/**
 * Adds a new mp4 segment to the mp4 segment queue
 *
 * @api public
 */
websocketlivestream.prototype.transcodeNextMp4Segment = function()
{
    var mostRecentMp4File = this.getMostRecentFile(this.mp4SegmentsPath, /webcam_part\d+\.mp4/i);

    this.addNewSegmentToMp4SegmentQueue(mostRecentMp4File);
};

/**
 * Adds a new mp4 segment to the mp4 segment queue
 *
 * @param {String} directory to find the newest file in
 * @param {Object} regular expression to limit the files
 * @api public
 */
websocketlivestream.prototype.getMostRecentFile = function(dir, regexp)
{
    var files = fs.readdirSync(dir);
    var mpgSegments = [];
    var match = '';

    for (var i = 0; i < files.length; i++) {
        if (files[i].match(regexp)) {
            match = files[i].match(regexp);
            mpgSegments.push(match[0]);
        }
    }

    // using underscore-library for finding recent file
    var mostRecentFile = _.max(mpgSegments, function(f) {
        var fullpath = path.join(dir, f);

        // replace ctime (creation time) with mtime for modification time
        return fs.statSync(fullpath).ctime;
    });
    return mostRecentFile;
};

/**
 * Transcodes a mpg segment into a mp4 segment via ffmpeg
 *
 * @api public
 */
websocketlivestream.prototype.transcodeToMp4 = function()
{
    this.isTranscodingToMp4 = true;
    var segment = this.webcamStreamPath + this.mpgSegmentQueue[0];
    var mp4filename = this.mpgSegmentQueue[0].split('.')[0];
    var myself = this;

    var command = ffmpeg(segment)
        .output(this.mp4SegmentsPath + mp4filename + '.mp4')
        .on('end', function() {
            console.log('finished MP4 transcoding; segment: ' + segment);
            myself.removeFirstSegmentInArray('mpgSegmentQueue');
            myself.isTranscodingToMp4 = false;
        })
        .on('error', function(err) {
            console.log('an error occured: ' + err.message);
        })
        .run();

    return mp4filename;
};

/**
 * Transcodes a mp4 segment into a dash segment via mp4box
 *
 * @api public
 */
websocketlivestream.prototype.transcodeToDASH = function()
{
    var segment = this.mp4SegmentsPath + this.mp4SegmentQueue[0];
    var dashFilename = this.mp4SegmentQueue[0].split('.')[0];

    exec('mp4box -dash 1500 -frag 500 -rap ' + segment, this.puts);

    var myself = this;

    setTimeout(function() {
        myself.removeFirstSegmentInArray('mp4SegmentQueue');
    }, 2000);
};

/**
 * Outputs the return value of the executed command
 *
 * @param {Object} error
 * @param {Object} stdout
 * @param {Object} stderr
 * @api public
 */
websocketlivestream.prototype.puts = function(error, stdout, stderr)
{
    console.log(stdout);
};

/**
 * Checks if the present sockets are still active
 * and sets 'doBroadcasting' flag to false if all sockets are not open
 *
 * @api public
 * TODO: wrong logic, edit this!
 */
websocketlivestream.prototype.checkOpenConnections = function()
{
    var counter = 0;

    this.sockets.forEach(function(socket) {
        if (socket.readyState === 0) {
            counter += 1;
        }
    });

    if(counter < 1) {
        this.doBroadcasting = false;
        return;
    }
    return;
};

/**
 * Initializes transcoder setup
 *
 * @param {String} determines path to the mpg segments resulting from webcamstream
 * @param {String} determines path to the mp4 segments
 * @param {String} path to the dash segments
 * @api public
 */
websocketlivestream.prototype.initTranscoder = function(webcamStreamPath, mp4SegmentsPath, dashsegmentsPath)
{
    this.name = 'TRANSCODER';
    this.webcamStreamPath = webcamStreamPath;
    this.mp4SegmentsPath = mp4SegmentsPath;
    this.dashsegmentsPath = dashsegmentsPath;
};

/**
 * Initializes edge server setup
 *
 * @param {String} determines the url of the WebSocket server to connect to
 * @param {String} determines the client server number that shall be used
 * @api public
 */
websocketlivestream.prototype.initEdgeServer = function(wssUrlSwitch, clientNo)
{
    this.name = 'EDGE-' + clientNo;
    this.wssPort = config.edge.wssPort;

    switch(clientNo)
    {
    case('1'):
        this.wsPort = config.edge.wsPort1;
        break;
    case('2'):
        this.wsPort = config.edge.wsPort2;
        break;
    }

    if(wssUrlSwitch === 'local')
    {
        this.wssUrl = config.localhost;
        this.wsUrl = config.localhost;
    }
    else if(wssUrlSwitch === 'network')
    {
        this.wssUrl = config.edge.wssUrl;

        switch(clientNo)
        {
        case('1'):
            this.wsUrl = config.edge.wsUrl1;
            break;
        case('2'):
            this.wsUrl = config.edge.wsUrl2;
            break;
        }
    }
};

/**
 * Initializes ingress server setup
 *
 * @param {String} determines the url of the WebSocket server to connect to
 * @param {String} determines the port of the WebSocket server to connect to
 * @param {String} the path to the das segments
 * @api public
 */
websocketlivestream.prototype.initIngressServer = function(wssUrlSwitch, wssPortSwitch, dashSegmentsPath)
{
    this.name = 'INGRESS-' + wssPortSwitch;
    this.dashSegmentsPath = dashSegmentsPath;

    if(wssUrlSwitch === 'local')
    {
        this.wssUrl = config.localhost;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '1')
    {
        this.wssUrl = config.ingress1.wssUrl;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '2')
    {
        this.wssUrl = config.ingress2.wssUrl;
    }

    if(wssPortSwitch === '1')
    {
        this.wssPort = config.ingress1.wssPort;
    }
    else if(wssPortSwitch === '2')
    {
        this.wssPort = config.ingress2.wssPort;
    }
};

/**
 * Initializes intermediate server setup
 *
 * @param {String} determines the url of the WebSocket server to connect to
 * @param {String} determines the port of the WebSocket server to connect to
 * @api public
 */
websocketlivestream.prototype.initIntermediateServer = function(wssUrlSwitch, wssPortSwitch)
{
    this.name = 'INTERMEDIATE-' + wssPortSwitch;

    if(wssUrlSwitch === 'local')
    {
        this.wssUrl = config.localhost;
        this.wsUrl = config.localhost;

        switch(wssPortSwitch)
        {
        case('11'):
            this.wssPort = config.intermediate11.wssPort;
            this.wsPort = config.intermediate11.wsPort;
            break;
        case('12'):
            this.wssPort = config.intermediate12.wssPort;
            this.wsPort = config.intermediate12.wsPort;
            break;
        case('21'):
            this.wssPort = config.intermediate21.wssPort;
            this.wsPort = config.intermediate21.wsPort;
            break;
        case('22'):
            this.wssPort = config.intermediate22.wssPort;
            this.wsPort = config.intermediate22.wsPort;
            break;
        case('31'):
            this.wssPort = config.intermediate31.wssPort;
            this.wsPort = config.intermediate31.wsPort;
            break;
        case('32'):
            this.wssPort = config.intermediate32.wssPort;
            this.wsPort = config.intermediate32.wsPort;
            break;
        }
    }
    else if(wssUrlSwitch === 'network')
    {
        switch(wssPortSwitch)
        {
        case('11'):
            this.wssUrl = config.intermediate11.wssUrl;
            this.wsUrl = config.intermediate11.wsUrl;
            this.wssPort = config.intermediate11.wssPort;
            this.wsPort = config.intermediate11.wsPort;
            break;
        case('12'):
            this.wssUrl = config.intermediate12.wssUrl;
            this.wsUrl = config.intermediate12.wsUrl;
            this.wssPort = config.intermediate12.wssPort;
            this.wsPort = config.intermediate12.wsPort;
            break;
        case('21'):
            this.wssUrl = config.intermediate21.wssUrl;
            this.wsUrl = config.intermediate21.wsUrl;
            this.wssPort = config.intermediate21.wssPort;
            this.wsPort = config.intermediate21.wsPort;
            break;
        case('22'):
            this.wssUrl = config.intermediate22.wssUrl;
            this.wsUrl = config.intermediate22.wsUrl;
            this.wssPort = config.intermediate22.wssPort;
            this.wsPort = config.intermediate22.wsPort;
            break;
        case('31'):
            this.wssUrl = config.intermediate31.wssUrl;
            this.wsUrl = config.intermediate31.wsUrl;
            this.wssPort = config.intermediate31.wssPort;
            this.wsPort = config.intermediate31.wsPort;
            break;
        case('32'):
            this.wssUrl = config.intermediate32.wssUrl;
            this.wsUrl = config.intermediate32.wsUrl;
            this.wssPort = config.intermediate32.wssPort;
            this.wsPort = config.intermediate32.wsPort;
            break;
        }
    }
};

/**
 * Initializes logging server setup
 *
 * @param {String} determines the url of the WebSocket server to connect to
 * @api public
 */
websocketlivestream.prototype.initLoggingServer = function(wssUrlSwitch)
{
    this.name = 'LOGGING-SERVER';
    this.wssPort = config.loggingServer.wssPort;

    if(wssUrlSwitch === 'local') {
        this.wssUrl = config.localhost;
    }
    else if (wssUrlSwitch === 'network')
    {
        this.wssUrl = config.loggingServer.wssUrl;
    }
};

/**
 * Initializes setup  of client connection to logging server
 *
 * @param {String} determines the url of the WebSocket server to connect to
 * @api public
 */
websocketlivestream.prototype.initLoggingServerConnection = function(wssUrlSwitch)
{
    this.wsLoggerPort = config.loggingServer.wssPort;

    if(wssUrlSwitch === 'local') {
        this.wsLoggerUrl = config.localhost;
    }
    else if (wssUrlSwitch === 'network')
    {
        this.wsLoggerUrl = config.loggingServer.wssUrl;
    }
};

module.exports = websocketlivestream;

}());