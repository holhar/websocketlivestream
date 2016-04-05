/*
    CDN Ingress Server (can also emulate Edge Server)
    - process.argv[2] = wssUrl switch
    - process.argv[3] = wssPort switch
*/

// module dependencies
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require('underscore');
var config = require('./config');

// enable usage of all available cpu cores
var cluster = require('cluster'); // required if worker id is needed
var sticky = require('sticky-session');

// helper vars
var mpgDashSegmentsPath = 'data/dashsegments/',
    broadcastQueue = [],
    isBroadcasting = false,
    wssUrl = '',
    wssPort = '',
    lastBroadcastElement;

// check for local or network CDN and server number
getServerSetup(process.argv[2], process.argv[3]);

// init and configure express webserver
var app = express();
var httpServer = require('http').createServer(app, function(req, res) {
    res.end('worker: ' + cluster.worker.id);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// init node server for all available cpu cores
if (!sticky.listen(httpServer, wssPort))
{
    httpServer.once('listening', function() {
        console.log('Started webserver, listening to port ' + wssPort);
        console.log('WebSocket-Server URL: ' + wssUrl + ':' + wssPort);
    });
} else {

    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: httpServer });

    var serverId = cluster.worker.id;
    console.log('Initiate server instance ' + serverId);
    var sockets = [];

    wss.on('connection', function(ws) {
        sockets.push(ws);

        startWatcher();

        ws.on('close', function() {
            ws = null;
        });
    });
}

// routes
app.get('/', function(req, res) {
    res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.',
        host: wssUrl + ':' + wssPort
    });
});
app.get('/stream', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream',
        teaser: 'Videostream with WebSockets and MediaSource Plugin',
        host: wssUrl + ':' + wssPort
    });
});

// functions
function startWatcher()
{
    broadcast(2);
    setTimeout(function() {
        broadcast(1);
    }, 5000);

    fs.watch(mpgDashSegmentsPath, { persistent: true, interval: 1000 }, function(curr, prev) {
        broadcast(1);
    });
}

function broadcast(chunkOffset)
{
    mostRecentFile = getMostRecentFile(mpgDashSegmentsPath, /webcam_part\d+_dashinit\.mp4/i, chunkOffset);

    if (typeof mostRecentFile === 'string')
    {
        addToQueue(mostRecentFile, broadcastQueue);

        if (isBroadcasting === false && broadcastQueue.length !== 0)
        {

            if (lastBroadcastElement == broadcastQueue[0]) {
                broadcastQueue.shift();
                return;
            }

            isBroadcasting = true;
            console.log('Broadcasting segment: ' + mpgDashSegmentsPath + broadcastQueue[0]);
            lastBroadcastElement = broadcastQueue[0];

            var readStream = fs.createReadStream(mpgDashSegmentsPath + broadcastQueue[0]);
            var count = 0;

            readStream.on('data', function(data) {
                count++;
                //logReadStreamData(data, count, sockets.length);
                sockets.forEach(function(socket) {
                    if (socket.readyState == 1) {
                        socket.send(data, { binary: true, mask: false });
                    }
                });
            });

            readStream.on('end', function() {
                broadcastQueue.shift();
                isBroadcasting = false;
            });
        }
    }
}

function addToQueue(newSegment, broadcastQueue)
{
    for(var i=0; i<broadcastQueue.length; i++) {
        if(broadcastQueue[i] === newSegment)
            return;
    }

    broadcastQueue.push(newSegment);
    return;
}

// Return only base file name without dir
function getMostRecentFile(dir, regexp, chunkOffset)
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

        // ctime = creation time is used
        // replace with mtime for modification time
        return fs.statSync(fullpath).ctime;
    });


    if (mpgSegments.length > chunkOffset) {
        index = mpgSegments.indexOf(mostRecentFile);
        return mpgSegments[index - chunkOffset];
    } else {
        return null;
    }
}

function getServerSetup(wssUrlSwitch, wssPortSwitch) {
    if(wssUrlSwitch === 'local')
    {
        wssUrl = config.localhost;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '1')
    {
        wssUrl = config.ingress1.wssUrl;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '2')
    {
        wssUrl = config.ingress2.wssUrl;
    }

    if(wssPortSwitch === '1')
    {
        wssPort = config.ingress1.wssPort;
    }
    else if(wssPortSwitch === '2')
    {
        wssPort = config.ingress2.wssPort;
    }
}

function logReadStreamData(data, count, socketLength)
{
    console.log("Type: " + typeof data + ", Size: " + data.length);
    console.log('Sending chunk of data: ' + count);
    console.log("Sending to " + socketLength + " sockets");
}