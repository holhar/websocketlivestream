/*
    Utilities for all WS-Server
*/
var config = require('./config'),
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    ffmpeg = require('fluent-ffmpeg'),
    exec = require('child_process').exec;

function websocketlivestream() {

    this.sockets = [],
    this.mp4SegmentQueue = [],
    this.dashSegmentQueue = [],
    this.broadcastQueue = [],

    this.isTranscodingToMp4 = false,
    this.isTranscodingToDASH = false,
    this.isBroadcasting = false,
    this.doBroadcasting = false,
    this.lastBroadcastElement = '',

    this.webcamStreamPath = '',
    this.mp4SegmentsPath = '',
    this.dashSegmentsPath = '',

    this.receiveCount = 0,
    this.sendCount = 0,

    this.wssUrl = '',
    this.wssPort = '',
    this.wsUrl = '',
    this.wsPort = '',

    this.initTranscoder = function(webcamStreamPath, mp4SegmentsPath, dashsegmentsPath)
    {
        this.webcamStreamPath = webcamStreamPath;
        this.mp4SegmentsPath = mp4SegmentsPath;
        this.dashsegmentsPath = dashsegmentsPath;
    },

    this.addSocket = function(socket)
    {
        this.sockets.push(socket);
    },

    this.removeSocket = function(socket)
    {
        var index = this.sockets.indexOf(socket);
        this.sockets.splice(index, 1);
    },

    this.addNewSegmentToMp4SegmentQueue = function(newSegment)
    {
        for(var i=0, max = this.mp4SegmentQueue.length; i < max; i++) {
            if(this.mp4SegmentQueue[i] === newSegment)
                return;
        }

        this.mp4SegmentQueue.push(newSegment);
        return;
    },

    this.addNewSegmentToDashSegmentQueue = function(newSegment)
    {
        for(var i=0, max = this.dashSegmentQueue.length; i < max; i++) {
            if(this.dashSegmentQueue[i] === newSegment)
                return;
        }

        this.dashSegmentQueue.push(newSegment);
        return;
    },

    this.addNewSegmentToBroadcastQueue = function(newSegment)
    {
        for(var i=0, max = this.broadcastQueue.length; i < max; i++) {
            if(this.broadcastQueue[i] === newSegment)
                return;
        }

        this.broadcastQueue.push(newSegment);
        return;
    },

    this.removeFirstSegmentInArray = function(queue)
    {
        switch(queue)
        {
        case('mp4SegmentQueue'):
            this.mp4SegmentQueue.shift();
            break;
        case('dashSegmentQueue'):
            this.dashSegmentQueue.shift();
            break;
        case('broadcastQueue'):
            this.broadcastQueue.shift();
            break;
        }
    },

    this.updateLastBroadcastElement = function()
    {
        this.lastBroadcastElement = this.broadcastQueue[0];
    },

    this.transcodeNextMpgSegment = function()
    {
        var mostRecentMpgFile = this.getMostRecentFile(this.webcamStreamPath, /webcam_part\d+\.mpg/i);
        this.addNewSegmentToMp4SegmentQueue(mostRecentMpgFile);
    },

    this.transcodeNextMp4Segment = function()
    {
        var mostRecentMp4File = this.getMostRecentFile(this.mp4SegmentsPath, /webcam_part\d+\.mp4/i);

        this.addNewSegmentToDashSegmentQueue(mostRecentMp4File);
    },

    this.getMostRecentFile = function(dir, regexp)
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
        mostRecentFile = _.max(mpgSegments, function(f) {
            var fullpath = path.join(dir, f);

            // replace ctime (creation time) with mtime for modification time
            return fs.statSync(fullpath).ctime;
        });

        return mostRecentFile;
    },

    this.transcodeToMp4 = function()
    {
        this.isTranscodingToMp4 = true;
        segment = this.webcamStreamPath + this.mp4SegmentQueue[0];
        mp4filename = this.mp4SegmentQueue[0].split('.')[0];

        var myself = this;

        var command = ffmpeg(segment)
            .output(this.mp4SegmentsPath + mp4filename + '.mp4')
            .on('end', function() {
                console.log('finished MP4 transcoding; segment: ' + segment);
                myself.removeFirstSegmentInArray('mp4SegmentQueue');
                myself.isTranscodingToMp4 = false;
            })
            .on('error', function(err) {
                console.log('an error occured: ' + err.message);
            })
            .run();
    },

    this.transcodeToDASH = function()
    {
        segment = this.mp4SegmentsPath + this.dashSegmentQueue[0];
        dashFilename = this.dashSegmentQueue[0].split('.')[0];

        exec('mp4box -dash 1500 -frag 500 -rap ' + segment, this.puts);

        var myself = this;

        setTimeout(function() {
            myself.removeFirstSegmentInArray('dashSegmentQueue');
        }, 2000);
    },

    this.puts = function(error, stdout, stderr)
    {
        console.log(stdout);
    },

    this.checkOpenConnections = function()
    {
        var counter = 0;

        sockets.forEach(function(socket) {
            if (socket.readyState === 0) {
                counter += 1;
            }
        });

        if(counter < 1) {
            doBroadcasting = false;
            return;
        }
        return;
    },

    this.initEdgeServer = function(wssUrlSwitch, clientNo)
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
    },

    this.initIngressServer = function(wssUrlSwitch, wssPortSwitch, dashSegmentsPath)
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
    },

    this.initIntermediateServer = function(wssUrlSwitch, wssPortSwitch)
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
    }
};

module.exports = websocketlivestream;