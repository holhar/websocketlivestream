/*
    CDN Ingress Server (can also emulate Edge Server)
    - process.argv[2] = wssUrl switch
    - process.argv[3] = wssPort switch
*/

// module dependencies
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    _ = require('underscore'),
    sticky = require('sticky-session'), // enable usage of all available cpu cores
    cluster = require('cluster'),       // required if worker id is needed
    websocketlivestream = require('./websocketlivestream'),
    logger = require('./logger');

// set CDN and server configuration
var wsLivestream = new websocketlivestream();
wsLivestream.initIngressServer(process.argv[2], process.argv[3], 'data/dashsegments/');

// init webserver
var app = express();
var httpServer = require('http').createServer(app, function(req, res) {
    res.end('worker: ' + cluster.worker.id);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// configure routes
app.get('/', function(req, res) {
    res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.',
        host: wsLivestream.wssUrl + ':' + wsLivestream.wssPort
    });
});
app.get('/stream1', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream',
        teaser: 'Videostream with WebSockets and MediaSource Plugin',
        host: wsLivestream.wssUrl + ':' + wsLivestream.wssPort
    });
});

// init node servers on all available cpu cores
if (!sticky.listen(httpServer, wsLivestream.wssPort))
{
    httpServer.once('listening', function() {
        logger.logWsServerPortListen(wsLivestream.wssPort);
        logger.logWebserverURL(wsLivestream.wssUrl, wsLivestream.wssPort);
    });
} else {

    // init ws-server
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: httpServer });
    logger.logNewServerInstance( cluster.worker.id );

    wss.on('connection', function(ws)
    {
        wsLivestream.addSocket(ws);
        logger.logNewClientConnection(ws.upgradeReq.url);

        ws.on('message', function(message)
        {
            logger.logIncomingMessage(message);

            if(message === 'startStream')
            {
                wsLivestream.doBroadcasting = true;
                logger.logWatcherStartup();
                startWatcher();
            }
            if(message === 'stopStream')
            {
                logger.logConnectionCheckup();
                wsLivestream.checkOpenConnections();
            }
        });

        ws.on('close', function(ws) {
            wsLivestream.removeSocket(ws);
        });
    });
}

// functions
function startWatcher()
{
    fs.watch(wsLivestream.dashSegmentsPath, { persistent: true, interval: 1000 }, function(curr, prev)
    {
        if(wsLivestream.doBroadcasting) {
            broadcast();
        }
    });
}

function broadcast()
{
    mostRecentFile = wsLivestream.getMostRecentFile(wsLivestream.dashSegmentsPath, /webcam_part\d+_dashinit\.mp4/i);

    if (typeof mostRecentFile === 'string')
    {
        wsLivestream.addNewSegmentToBroadcastQueue(mostRecentFile);

        if (wsLivestream.isBroadcasting === false && wsLivestream.broadcastQueue.length !== 0)
        {
            if (wsLivestream.lastBroadcastElement == wsLivestream.broadcastQueue[0]) {
                wsLivestream.removeFirstSegmentInArray('broadcastQueue');
                return;
            }

            wsLivestream.isBroadcasting = true;
            wsLivestream.updateLastBroadcastElement();
            logger.logSegmentBroadcasting(wsLivestream.broadcastQueue[0]);

            var readStream = fs.createReadStream(wsLivestream.dashSegmentsPath + wsLivestream.broadcastQueue[0]);

            readStream.on('data', function(data)
            {
                wsLivestream.sendCount += 1;
                logger.logOutgoingVideoData(wsLivestream.sendCount, data);

                wsLivestream.sockets.forEach(function(socket) {
                    if (socket.readyState == 1) {
                        socket.send(data, { binary: true, mask: false });
                    }
                });
            });

            readStream.on('end', function() {
                wsLivestream.removeFirstSegmentInArray('broadcastQueue');
                wsLivestream.isBroadcasting = false;
            });
        }
    }
}