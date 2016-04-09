/*
 * loggingServer: console logs any message receiving from connected other servers
 * - process.argv[2] = wssUrl switch
 */

var WebSocketServer = require('ws').Server,
    WebSocketLivestream = require('./WebSocketLivestream');

var wsLivestream = new WebSocketLivestream();

// set CDN and server configuration
wsLivestream.initLoggingServer(process.argv[2]);

var wss = new WebSocketServer({ port: wsLivestream.wssPort });

console.log('Started ' + wsLivestream.name + ' at ' + wsLivestream.wssUrl + ':' + wsLivestream.wssPort);
console.log('=========================================');

wss.on('connection', function(ws)
{
    ws.on('message', function(message)
    {
        console.log(message);
    });
});