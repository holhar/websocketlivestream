/*
    CDN Intermediate Server
    - process.argv[2] = wssUrl switch
    - process.argv[3] = wssPort switch
*/

var WebSocketLivestream    = require('./WebSocketLivestream'),
    logger          = require('./logger'),
    WebSocketServer = require('ws').Server;

// set CDN and server configuration
var wsLivestream = new WebSocketLivestream();
wsLivestream.initIntermediateServer(process.argv[2], process.argv[3]);

// init ws-server
var wss = new WebSocketServer({ port: wsLivestream.wssPort });
logger.logWsServerPortListen(wsLivestream.wssPort);

wss.on('connection', function(ws) {

    wsLivestream.addSocket(ws);
    logger.logNewClientConnection(ws.upgradeReq.url);

    ws.on('message', function(message) {
        logger.logIncomingMessage(message);
        wsc.send(message);
    });

    ws.on('close', function(ws) {
        wsLivestream.removeSocket(ws);
    });
});

// init ws-client
var WebSocket = require('ws');
var wsc = new WebSocket('ws://' + wsLivestream.wsUrl + ':' + wsLivestream.wsPort);
logger.logWsClientStartup(wsLivestream.wsUrl, wsLivestream.wsPort);

wsc.binaryType = 'arraybuffer';
wsc.onmessage = function(message)
{
    wsLivestream.receiveCount += 1;
    logger.logIncomingVideoData(wsLivestream.receiveCount, message.data);
    broadcast(message);
};

function broadcast(message)
{
    wsLivestream.sendCount += 1;
    logger.logOutgoingVideoData(wsLivestream.sendCount, message.data);

    wsLivestream.sockets.forEach(function(socket) {
        if(socket.readyState == 1) {
            socket.send(message.data, { binary: true, mask: false });
        }
    });
}