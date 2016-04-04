/*
    CDN Intermediate Server
    - process.argv[2] = server port
    - process.argv[3] = client ws-url + port
*/

// ws-server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: process.argv[2] });
console.log('Server running and listening to port ' + process.argv[2]);

var sockets = [];
var broadcastqueue = [];
var recieveCount = 0;
var sendCount = 0;

wss.on('connection', function(ws) {

    console.log('client connected');
    sockets.push(ws);

    ws.on('close', function() {
        ws = null;
    });
});

// ws-client
console.log('Client trying to connect to ' + process.argv[3]);
var WebSocket = require('ws');
var wsc = new WebSocket('ws://' + process.argv[3]);

wsc.binaryType = 'arraybuffer';
wsc.onmessage = function(message) {
    recieveCount += 1;
    logIncomingData(message.data, recieveCount, sockets.length);

    broadcastqueue.push(message.data);

    setTimeout(function() {
        broadcast();
    }, 2000);
};

function broadcast()
{
    sendCount += 1;
    logOutgoingData(broadcastqueue[0], sendCount, sockets.length);

    sockets.forEach(function(ws) {
        if(ws.readyState == 1) {
            ws.send(broadcastqueue[0], { binary: true, mask: false });
        }
    });
    broadcastqueue.shift();
}

function logIncomingData(data, count, socketLength)
{
    console.log("Type: " + typeof data + ", Size: " + data.length);
    console.log('Receiving chunk of data: ' + count);
    // console.log("Sending to " + socketLength + " sockets");
}

function logOutgoingData(data, count, socketLength)
{
    console.log("Type: " + typeof data + ", Size: " + data.length);
    console.log('Sending chunk of data: ' + count);
    // console.log("Sending to " + socketLength + " sockets");
}