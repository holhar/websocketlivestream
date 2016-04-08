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
function WebSocketLivestream()
{
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
}

/**
 * Adds new socket connection to queue
 *
 * @param {Object} socket-connection that has been initiated
 * @api public
 */
WebSocketLivestream.prototype.addSocket = function(socket)
{
    this.sockets.push(socket);
};

/**
 * Removes socket connection from queue
 *
 * @param {Object} socket-connection to be removed
 * @api public
 */
WebSocketLivestream.prototype.removeSocket = function(socket)
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
WebSocketLivestream.prototype.addNewSegmentToMpgSegmentQueue = function(newSegment)
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
WebSocketLivestream.prototype.addNewSegmentToMp4SegmentQueue = function(newSegment)
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
WebSocketLivestream.prototype.addNewSegmentToBroadcastQueue = function(newSegment)
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
WebSocketLivestream.prototype.removeFirstSegmentInArray = function(queue)
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
WebSocketLivestream.prototype.updateLastBroadcastElement = function()
{
    this.lastBroadcastElement = this.broadcastQueue[0];
};

/**
 * Adds a new mpg segment to the mpg segment queue
 *
 * @api public
 */
WebSocketLivestream.prototype.setupNextMpgTranscodingCycle = function()
{
    var mostRecentMpgFile = this.getMostRecentFile(this.webcamStreamPath, /webcam_part\d+\.mpg/i);
    this.addNewSegmentToMpgSegmentQueue(mostRecentMpgFile);
};

/**
 * Adds a new mp4 segment to the mp4 segment queue
 *
 * @api public
 */
WebSocketLivestream.prototype.transcodeNextMp4Segment = function()
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
WebSocketLivestream.prototype.getMostRecentFile = function(dir, regexp)
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
WebSocketLivestream.prototype.transcodeToMp4 = function()
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
};

/**
 * Transcodes a mp4 segment into a dash segment via mp4box
 *
 * @api public
 */
WebSocketLivestream.prototype.transcodeToDASH = function()
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
WebSocketLivestream.prototype.puts = function(error, stdout, stderr)
{
    console.log(stdout);
};

/**
 * Checks if the present sockets are still active
 * and sets 'doBroadcasting' flag to false if all sockets are not open
 *
 * @api public
 */
WebSocketLivestream.prototype.checkOpenConnections = function()
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
 * @param {String} path to the mpg segments resulting from webcamstream
 * @param {String} path to the mp4 segments
 * @param {String} path to the dash segments
 * @api public
 */
WebSocketLivestream.prototype.initTranscoder = function(webcamStreamPath, mp4SegmentsPath, dashsegmentsPath)
{
    this.webcamStreamPath = webcamStreamPath;
    this.mp4SegmentsPath = mp4SegmentsPath;
    this.dashsegmentsPath = dashsegmentsPath;
};

/**
 * Initializes edge server setup
 *
 * @param {String} the url of the WebSocket server to connect to
 * @param {String} the client server number that shall be used
 * @api public
 */
WebSocketLivestream.prototype.initEdgeServer = function(wssUrlSwitch, clientNo)
{
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
        this.wssUrl = config.egde.wssUrl;

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
 * @param {String} the url of the WebSocket server to connect to
 * @param {String} the port of the WebSocket server to connect to
 * @param {String} the path to the das segments
 * @api public
 */
WebSocketLivestream.prototype.initIngressServer = function(wssUrlSwitch, wssPortSwitch, dashSegmentsPath)
{
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
 * @param {String} the url of the WebSocket server to connect to
 * @param {String} the port of the WebSocket server to connect to
 * @api public
 */
WebSocketLivestream.prototype.initIntermediateServer = function(wssUrlSwitch, wssPortSwitch)
{
    if(wssUrlSwitch === 'local')
    {
        this.wssUrl = config.localhost;
        this.wsUrl = config.localhost;

        switch(wssPortSwitch)
        {
        case('1'):
            this.wssPort = config.intermediate1.wssPort;
            this.wsPort = config.intermediate1.wsPort;
            break;
        case('2'):
            this.wssPort = config.intermediate2.wssPort;
            this.wsPort = config.intermediate2.wsPort;
            break;
        case('3'):
            this.wssPort = config.intermediate3.wssPort;
            this.wsPort = config.intermediate3.wsPort;
            break;
        case('4'):
            this.wssPort = config.intermediate4.wssPort;
            this.wsPort = config.intermediate4.wsPort;
            break;
        }
    }
    else if(wssUrlSwitch === 'network')
    {
        switch(wssPortSwitch)
        {
        case('1'):
            this.wssUrl = config.intermediate1.wssUrl;
            this.wsUrl = config.intermediate1.wsUrl;
            this.wssPort = config.intermediate1.wssPort;
            this.wsPort = config.intermediate1.wsPort;
            break;
        case('2'):
            this.wssUrl = config.intermediate2.wssUrl;
            this.wsUrl = config.intermediate2.wsUrl;
            this.wssPort = config.intermediate2.wssPort;
            this.wsPort = config.intermediate2.wsPort;
            break;
        case('3'):
            this.wssUrl = config.intermediate3.wssUrl;
            this.wsUrl = config.intermediate3.wsUrl;
            this.wssPort = config.intermediate3.wssPort;
            this.wsPort = config.intermediate3.wsPort;
            break;
        case('4'):
            this.wssUrl = config.intermediate4.wssUrl;
            this.wsUrl = config.intermediate4.wsUrl;
            this.wssPort = config.intermediate4.wssPort;
            this.wsPort = config.intermediate4.wsPort;
            break;
        }
    }
};

module.exports = WebSocketLivestream;

}());