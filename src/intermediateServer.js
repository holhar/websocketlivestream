/*
    CDN Intermediate Server
    - process.argv[2] = wssUrl switch
    - process.argv[3] = wssPort switch
*/

var config = require('./config'),
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

    console.log('client connected');
    sockets.push(ws);

    ws.on('close', function() {
        ws = null;
    });
});

// ws-client
console.log('Client trying to connect to ' + wsUrl + ':' + wsPort);
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

function getServerSetup(wssUrlSwitch, wssPortSwitch) {
    if(wssUrlSwitch === 'local')
    {
        wssUrl = config.localhost;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '1')
    {
        wssUrl = config.intermediate1.wssUrl;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '2')
    {
        wssUrl = config.intermediate2.wssUrl;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '3')
    {
        wssUrl = config.intermediate3.wssUrl;
    }
    else if(wssUrlSwitch === 'network' && wssPortSwitch === '4')
    {
        wssUrl = config.intermediate4.wssUrl;
    }

    if(wssPortSwitch === '1')
    {
        wssPort = config.intermediate1.wssPort;
        wsUrl = (wssUrlSwitch === 'local') ? config.localhost : config.intermediate1.wsUrl;
        wsPort = config.intermediate1.wsPort;
    }
    else if(wssPortSwitch === '2')
    {
        wssPort = config.intermediate2.wssPort;
        wsUrl = (wssUrlSwitch === 'local') ? config.localhost : config.intermediate2.wsUrl;
        wsPort = config.intermediate2.wsPort;
    }
    else if(wssPortSwitch === '3')
    {
        wssPort = config.intermediate3.wssPort;
        wsUrl = (wssUrlSwitch === 'local') ? config.localhost : config.intermediate3.wsUrl;
        wsPort = config.intermediate3.wsPort;
    }
    else if(wssPortSwitch === '4')
    {
        wssPort = config.intermediate4.wssPort;
        wsUrl = (wssUrlSwitch === 'local') ? config.localhost : config.intermediate4.wsUrl;
        wsPort = config.intermediate4.wsPort;
    }
}