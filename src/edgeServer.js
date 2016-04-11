/*
 * CDN Edge Server
 * - process.argv[2] = wssUrl switch
 */

// module dependencies
var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    Logger = require('./logger'),
    sticky = require('sticky-session'), // enable usage of all available cpu cores
    cluster = require('cluster'),       // required if worker id is needed
    express = require('express'),
    bodyParser = require('body-parser'),
    WebSocket = require('ws'),
    WebSocketServer = require('ws').Server,
    websocketlivestream = require('./websocketlivestream');

// init objects
var logger = new Logger(),
    wsLivestream = new websocketlivestream(),
    wsLivestream1 = new websocketlivestream(),
    wsLivestream2 = new websocketlivestream();

// set CDN and server configuration
wsLivestream.initLoggingServerConnection(process.argv[2]);
wsLivestream.initEdgeServer(process.argv[2], '1');
wsLivestream1.initEdgeServer(process.argv[2], '1');
wsLivestream2.initEdgeServer(process.argv[2], '2');

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
app.get('/', function (req,res){
  res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.',
        host: wsLivestream1.wssUrl + ':' + wsLivestream1.wssPort
    });
});
app.get('/stream1', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream 1',
        teaser: 'Videostream 1 with WebSockets and MediaSource Plugin',
        host: wsLivestream1.wssUrl + ':' + wsLivestream1.wssPort,
        ingress: '1'
    });
});
app.get('/stream2', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream 2',
        teaser: 'Videostream 2 with WebSockets and MediaSource Plugin',
        host: wsLivestream2.wssUrl + ':' + wsLivestream2.wssPort,
        ingress: '2'
    });
});

// init node servers on all available cpu cores
if (!sticky.listen(httpServer, wsLivestream1.wssPort)) {
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
            sendLog(logger.logNewClientConnection(wsLivestream.name, ws.upgradeReq.url));

            if (ws.upgradeReq.url === '/stream1') {
                wsLivestream1.addSocket(ws);
            }

            if (ws.upgradeReq.url === '/stream2') {
                wsLivestream2.addSocket(ws);
            }

            ws.on('message', function(message)
            {
                // sendLog(logger.logIncomingMessage(wsLivestream.name, message));

                // TODO: only send stopStream if there are no client connections
                switch(message)
                {
                case('startStream1'):
                    wsc1.send('startStream');
                    break;
                case('startStream2'):
                    wsc2.send('startStream');
                    break;
                case('stopStream1'):
                    // wsc1.send('stopStream');
                    break;
                case('stopStream2'):
                    // wsc2.send('stopStream');
                    break;
                }
            });

            ws.on('close', function() {
                this.close();
            });
        });

        // init ws-client 1
        var wsc1 = new WebSocket('ws://' + wsLivestream1.wsUrl + ':' + wsLivestream1.wsPort);
        sendLog(logger.logWsClientStartup(wsLivestream.name, wsLivestream1.wsUrl, wsLivestream1.wsPort));

        wsc1.binaryType = 'arraybuffer';
        wsc1.onmessage = function(message)
        {
            // wsLivestream1.receiveCount += 1;
            // sendLog(logger.logIncomingVideoData(wsLivestream.name, wsLivestream1.receiveCount, message.data));

            broadcast(message, 'wsc1');
        };

        // init ws-client 2
        var wsc2 = new WebSocket('ws://' + wsLivestream2.wsUrl + ':' + wsLivestream2.wsPort);
        sendLog(logger.logWsClientStartup(wsLivestream.name, wsLivestream2.wsUrl, wsLivestream2.wsPort));

        wsc2.binaryType = 'arraybuffer';
        wsc2.onmessage = function(message)
        {
            // wsLivestream2.receiveCount += 1;
            // sendLog(logger.logIncomingVideoData(wsLivestream.name, wsLivestream2.receiveCount, message.data));

            broadcast(message, 'wsc2');
        };
    });
}

// functions
function broadcast(message, wscNo)
{
    if(wscNo === 'wsc1') {
        // wsLivestream1.sendCount += 1;
        // sendLog(logger.logOutgoingVideoData(wsLivestream.name, wsLivestream1.sendCount, message.data));

        wsLivestream1.sockets.forEach(function(socket)
        {
            if(socket.readyState == 1) {
                socket.send(message.data, { binary: true, mask: false });
            }
        });
    }

    if(wscNo === 'wsc2') {
        // wsLivestream2.sendCount += 1;
        // sendLog(logger.logOutgoingVideoData(wsLivestream.name, wsLivestream2.sendCount, message.data));

        wsLivestream2.sockets.forEach(function(socket)
        {
            if(socket.readyState == 1) {
                socket.send(message.data, { binary: true, mask: false });
            }
        });
    }
}

function sendLog(message)
{
    if(wsLogger.readyState === 1)
    {
        wsLogger.send(message, { binary: false, mask: true });
    }
}