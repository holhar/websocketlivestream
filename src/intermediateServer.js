/*
    CDN Intermediate Server
    - process.argv[2] = wssUrl switch
    - process.argv[3] = wssPort switch
*/

var config = require('./config'),
    broadcastUtils = require('./broadcastUtils'),
    sockets = [],
    recieveCount = 0,
    sendCount = 0,
    wssUrl = '',
    wssPort = '',
    wsUrl = '',
    wsPort = '';

// check for local or network CDN and server number
getServerSetup(process.argv[2], process.argv[3]);

// ws-server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: wssPort });
console.log('Server running and listening to port ' + wssPort);

wss.on('connection', function(ws) {

    console.log('ws-client connected');
    sockets.push(ws);

    ws.on('message', function(message) {
        console.log('message from client: ' + message);
        wsc.send(message);
    });

    ws.on('close', function() {
        ws = null;
    });
});

// ws-client
console.log('ws-client connecting to ws-server: ' + wsUrl + ':' + wsPort);
var WebSocket = require('ws');

var wsc = new WebSocket('ws://' + wsUrl + ':' + wsPort);

wsc.binaryType = 'arraybuffer';
wsc.onmessage = function(message) {
    recieveCount += 1;
    logIncomingData(message.data, recieveCount, sockets.length);

    broadcast(message);
};

function broadcast(message)
{
    sendCount += 1;
    logOutgoingData(message.data, sendCount, sockets.length);

    sockets.forEach(function(ws) {
        if(ws.readyState == 1) {
            ws.send(message.data, { binary: true, mask: false });
        }
    });
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

function getServerSetup(wssUrlSwitch, wssPortSwitch)
{
    if(wssUrlSwitch === 'local')
    {
        wssUrl = config.localhost;
        wsUrl = config.localhost;

        switch(wssPortSwitch)
        {
            case('1'):
                wssPort = config.intermediate1.wssPort;
                wsPort = config.intermediate1.wsPort;
                break;
            case('2'):
                wssPort = config.intermediate2.wssPort;
                wsPort = config.intermediate2.wsPort;
                break;
            case('3'):
                wssPort = config.intermediate3.wssPort;
                wsPort = config.intermediate3.wsPort;
                break;
            case('4'):
                wssPort = config.intermediate4.wssPort;
                wsPort = config.intermediate4.wsPort;
                break;
        }
    }
    else if(wssUrlSwitch === 'network')
    {
        switch(wssPortSwitch)
        {
            case('1'):
                wssUrl = config.intermediate1.wssUrl;
                wsUrl = config.intermediate1.wsUrl;
                wssPort = config.intermediate1.wssPort;
                wsPort = config.intermediate1.wsPort;
                break;
            case('2'):
                wssUrl = config.intermediate2.wssUrl;
                wsUrl = config.intermediate2.wsUrl;
                wssPort = config.intermediate2.wssPort;
                wsPort = config.intermediate2.wsPort;
                break;
            case('3'):
                wssUrl = config.intermediate3.wssUrl;
                wsUrl = config.intermediate3.wsUrl;
                wssPort = config.intermediate3.wssPort;
                wsPort = config.intermediate3.wsPort;
                break;
            case('4'):
                wssUrl = config.intermediate4.wssUrl;
                wsUrl = config.intermediate4.wsUrl;
                wssPort = config.intermediate4.wssPort;
                wsPort = config.intermediate4.wsPort;
                break;
        }
    }
}