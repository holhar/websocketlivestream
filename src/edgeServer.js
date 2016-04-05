/*
    CDN Edge Server
    - process.argv[2] = wssUrl switch
*/

// module dependencies
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require('underscore');
var config = require('./config');
var broadcastUtils = require('./broadcastUtils');

// enable usage of all available cpu cores
var cluster = require('cluster'); // required if worker id is needed
var sticky = require('sticky-session');

// helper vars
var recieveCount = 0,
    sendCount = 0,
    wssUrl = '',
    wssPort = config.edge.wssPort,
    wsUrl1 = '',
    wsPort1 = config.edge.wsPort1,
    wsUrl2 = '',
    wsPort2 = config.edge.wsPort2;

// check for local or network CDN and server number
getServerSetup(process.argv[2]);


// init and configure express webserver
var app = express();
var httpServer = require('http').createServer(app, function(req, res) {
    res.end('worker: ' + cluster.worker.id);
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/', function (req,res){
  res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.',
        host: wssUrl + ':' + wssPort
    });
});
app.get('/stream1', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream 1',
        teaser: 'Videostream 1 with WebSockets and MediaSource Plugin',
        host: wssUrl + ':' + wssPort,
        ingress: '1'
    });
});
app.get('/stream2', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream 2',
        teaser: 'Videostream 2 with WebSockets and MediaSource Plugin',
        host: wssUrl + ':' + wssPort,
        ingress: '2'
    });
});

// init node servers on all available cpu cores
if (!sticky.listen(httpServer, wssPort)) {
    httpServer.once('listening', function() {
        console.log('Started webserver, listening to port ' + wssPort);
        console.log('host address: ' + wssUrl + ':' + wssPort);
    });
} else {

    // ws server
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: httpServer });

    var serverId = cluster.worker.id;
    console.log('Initiate server instance ' + serverId);
    console.log('config edge-server ip: ' + config.edge.ip);
    var sockets1 = [],
        sockets2 = [];

    wss.on('connection', function(ws) {

        console.log('ws-client connected: ' + ws.upgradeReq.url);
        if (ws.upgradeReq.url === '/stream1')
            sockets1.push(ws);

        if (ws.upgradeReq.url === '/stream2')
            sockets2.push(ws);

        ws.on('message', function(message) {
            console.log('message from client: ' + message);

            switch(message)
            {
                case('startStream1'):
                    wsc1.send('startStream');
                    break;
                case('startStream2'):
                    wsc2.send('startStream');
                    break;
                case('stopStream1'):
                    wsc1.send('stopStream');
                    break;
                case('stopStream2'):
                    wsc2.send('stopStream');
                    break;
            }
        });

        ws.on('close', function() {
            ws = null;
        });
    });

    // ws client 1
    console.log('ws-client1 connecting to ws-server: ' + wsUrl1 + ':' + wsPort1);
    var WebSocket1 = require('ws');
    var wsc1 = new WebSocket1('ws://' + wsUrl1 + ':' + wsPort1);

    wsc1.binaryType = 'arraybuffer';
    wsc1.onmessage = function(message) {
        recieveCount += 1;
        logIncomingData(message.data, recieveCount, sockets1.length);

        broadcast(message, 'wsc1');
    };

    // ws client 2
    console.log('ws-client2 connecting to ws-server: ' + wsUrl2 + ':' + wsPort2);
    var WebSocket2 = require('ws');
    var wsc2 = new WebSocket2('ws://' + wsUrl2 + ':' + wsPort2);

    wsc2.binaryType = 'arraybuffer';
    wsc2.onmessage = function(message) {
        recieveCount += 1;
        logIncomingData(message.data, recieveCount, sockets2.length);

        broadcast(message, 'wsc2');
    };
}

// functions
function broadcast(message, wscNo)
{
    if(wscNo === 'wsc1') {
        sendCount += 1;
        logOutgoingData(message.data, sendCount, sockets1.length);

        sockets1.forEach(function(ws) {
            if(ws.readyState == 1) {
                ws.send(message.data, { binary: true, mask: false });
            }
        });
    }

    if(wscNo === 'wsc2') {
        sendCount += 1;
        logOutgoingData(message.data, sendCount, sockets2.length);

        sockets2.forEach(function(ws) {
            if(ws.readyState == 1) {
                ws.send(message.data, { binary: true, mask: false });
            }
        });
    }
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

function getServerSetup(wssUrlSwitch) {
    if(wssUrlSwitch === 'local')
    {
        wssUrl = config.localhost;
        wsUrl1 = config.localhost;
        wsUrl2 = config.localhost;
    }
    else if(wssUrlSwitch === 'network')
    {
        wssUrl = config.egde.wssUrl;
        wsUrl1 = config.edge.wsUrl1;
        wsUrl2 = config.edge.wsUrl2;
    }
}