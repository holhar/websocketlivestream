/*
 * CDN Intermediate Server
 * - process.argv[2] = wssUrl switch
 * - process.argv[3] = wssPort switch
 */

// module dependencies
var Logger = require('./logger'),
    WebSocket = require('ws'),
    WebSocketServer = require('ws').Server,
    websocketlivestream = require('./websocketlivestream');

// init objects
var logger = new Logger(),
    wsLivestream = new websocketlivestream();

// set CDN and server configuration
wsLivestream.initLoggingServerConnection(process.argv[2]);
wsLivestream.initIntermediateServer(process.argv[2], process.argv[3]);

// init ws logger
var wsLogger = new WebSocket('ws://' + wsLivestream.wsLoggerUrl + ':' + wsLivestream.wsLoggerPort);

wsLogger.on('close', function close() {
  console.log('disconnected from loggingServer');
});

wsLogger.on('open', function open(ws)
{
    // init ws-server
    var wss = new WebSocketServer({ port: wsLivestream.wssPort });
    sendLog(logger.logServerURL(wsLivestream.name, wsLivestream.wssUrl, wsLivestream.wssPort));

    wss.on('connection', function(ws)
    {
        wsLivestream.addSocket(ws);
        sendLog(logger.logNewClientConnection(wsLivestream.name, ws.upgradeReq.url));

        ws.on('message', function(message) {
            sendLog(logger.logIncomingMessage(wsLivestream.name, message));
            wsc.send(message);
        });

        ws.on('close', function(ws) {
            wsLivestream.removeSocket(ws);
        });
    });

    // init ws-client
    var WebSocket = require('ws');
    var wsc = new WebSocket('ws://' + wsLivestream.wsUrl + ':' + wsLivestream.wsPort);
    sendLog(logger.logWsClientStartup(wsLivestream.name, wsLivestream.wsUrl, wsLivestream.wsPort));

    wsc.binaryType = 'arraybuffer';
    wsc.onmessage = function(message)
    {
        wsLivestream.receiveCount += 1;
        sendLog(logger.logIncomingVideoData(wsLivestream.name, wsLivestream.receiveCount, message.data));
        broadcast(message);
    };
});

// functions
function broadcast(message)
{
    wsLivestream.sendCount += 1;
    sendLog(logger.logOutgoingVideoData(wsLivestream.name, wsLivestream.sendCount, message.data));

    wsLivestream.sockets.forEach(function(socket) {
        if(socket.readyState == 1) {
            socket.send(message.data, { binary: true, mask: false });
        }
    });
}

function sendLog(message)
{
    if(wsLogger.readyState === 1)
    {
        wsLogger.send(message, { binary: false, mask: true });
    }
}