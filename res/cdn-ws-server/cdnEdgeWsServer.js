var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8081 });
console.log('Server running and listening to port 8081');

var clients = [];
var data = [];

wss.on('connection', function(ws) {
    console.log('client connected');
    clients.push(ws);
    sendData();
});

var WebSocket = require('ws');
var wsc = new WebSocket('ws://localhost:8080');

wsc.binaryType = 'arraybuffer';
wsc.onmessage = function(message) {
    data.push(message.data);
};

function sendData()
{
    clients.forEach(function(client) {
        for(var i=0; i<data.length; i++) {
            client.send(data[i], { binary: true, mask: false });
        }
    });
}