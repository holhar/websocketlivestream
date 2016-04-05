/*
    CDN Edge Server
    - process.argv[2] = wssUrl switch

    - process.argv[2] = server port
    - process.argv[3] = host for client app
    - process.argv[4] = client ws-url + port
*/

// module dependencies
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require('underscore');
var config = require('./config');

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

// init node server for all available cpu cores
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
    var sockets = [];

    wss.on('connection', function(ws) {

        console.log('client connected');
        sockets.push(ws);
        ws.on('close', function() {
            ws = null;
        });
    });

    // ws client 1
    console.log('Ws-client 1 trying to connect to ' + wsUrl1 + ':' + wsPort1);
    var WebSocket1 = require('ws');
    var wsc1 = new WebSocket1('ws://' + wsUrl1 + ':' + wsPort1);

    wsc1.binaryType = 'arraybuffer';
    wsc1.onmessage = function(message) {
        recieveCount += 1;
        logIncomingData(message.data, recieveCount, sockets.length);

        broadcast(message);
    };

    // ws client 1
    console.log('Ws-client 2 trying to connect to ' + wsUrl2 + ':' + wsPort2);
    var WebSocket2 = require('ws');
    var wsc2 = new WebSocket2('ws://' + wsUrl2 + ':' + wsPort2);

    wsc2.binaryType = 'arraybuffer';
    wsc2.onmessage = function(message) {
        recieveCount += 1;
        logIncomingData(message.data, recieveCount, sockets.length);

        broadcast(message);
    };
}

// routes
app.get('/', function (req,res){
  res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.',
        host: wssUrl + ':' + wssPort
    });
});
app.get('/stream', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream',
        teaser: 'Videostream with WebSockets and MediaSource Plugin',
        host: wssUrl + ':' + wssPort
    });
});

// functions
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