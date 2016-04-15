/*
 * CDN Ingress Server (can also emulate Edge Server)
 * - process.argv[2] = wssUrl switch
 * - process.argv[3] = wssPort switch
 */

// module dependencies
var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    logger = require('./logger'),
    sticky = require('sticky-session'), // use available cpu cores
    cluster = require('cluster'),       // required if worker id is needed
    express = require('express'),
    bodyParser = require('body-parser'),
    WebSocket = require('ws'),
    WebSocketServer = require('ws').Server,
    websocketlivestream = require('./websocketlivestream');

// init objects
var logger = new logger(),
    wsLivestream = new websocketlivestream();

// set CDN and server configuration
wsLivestream.initLoggingServerConnection(process.argv[2]);
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
    httpServer.once('listening', function() {});
}
else
{
    // init ws logger
    var wsLogger = new WebSocket('ws://' + wsLivestream.wsLoggerUrl + ':' + wsLivestream.wsLoggerPort);

    wsLogger.on('close', function close() {
      console.log('disconnected from loggingServer');
    });

    wsLogger.on('open', function open(ws)
    {
        if(cluster.worker.id == '1') {
            sendLog(logger.logServerURL(wsLivestream.name, wsLivestream.wssUrl, wsLivestream.wssPort));
        }

        // init ws-server
        var wss = new WebSocketServer({ server: httpServer });
        sendLog(logger.logNewServerInstance(wsLivestream.name, cluster.worker.id));

        wss.on('connection', function(ws)
        {
            wsLivestream.addSocket(ws);
            sendLog(logger.logNewClientConnection(wsLivestream.name, ws.upgradeReq.url));

            wsLivestream.doBroadcasting = true;
            sendLog(logger.logWatcherStartup(wsLivestream.name));
            startWatcher();

            ws.on('message', function(message)
            {
                // sendLog(logger.logIncomingMessage(wsLivestream.name, message));

                if(message === 'startStream')
                {
                    wsLivestream.doBroadcasting = true;
                    sendLog(logger.logWatcherStartup(wsLivestream.name));
                    startWatcher();
                }
                if(message === 'stopStream')
                {
                    sendLog(logger.logConnectionCheckup(wsLivestream.name));
                    wsLivestream.checkOpenConnections();
                }
            });

            ws.on('close', function(ws) {
                wsLivestream.removeSocket(ws);
            });
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
            sendLog(logger.logSegmentBroadcasting(wsLivestream.name, wsLivestream.broadcastQueue[0]));

            var readStream = fs.createReadStream(wsLivestream.dashSegmentsPath + wsLivestream.broadcastQueue[0]);

            readStream.on('data', function(data)
            {
                // wsLivestream.sendCount += 1;
                // sendLog(logger.logOutgoingVideoData(wsLivestream.name, wsLivestream.sendCount, data));

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

function sendLog(message)
{
    if(wsLogger.readyState === 1)
    {
        wsLogger.send(message, { binary: false, mask: true });
    }
}