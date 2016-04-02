/*
    CDN Edge Server
    - process.argv[2] = server port
    - process.argv[3] = client ws-url + port
*/

// module dependencies
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var fs = require('fs');
var _ = require('underscore');

// enable usage of all available cpu cores
var cluster = require('cluster'); // required if worker id is needed
var sticky = require('sticky-session');

// helper vars
var broadcastqueue = [],
    recieveCount = 0,
    sendCount = 0;


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
if (!sticky.listen(httpServer, process.argv[2])) {
    httpServer.once('listening', function() {
        console.log('Started webserver, listening to port ' + process.argv[2]);
    });
} else {

    // ws server
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: httpServer });

    var serverId = cluster.worker.id;
    console.log('Initiate server instance ' + serverId);
    var sockets = [];

    wss.on('connection', function(ws) {

        console.log('client connected');
        sockets.push(ws);
        ws.on('close', function() {
            ws = null;
        });
    });

    // ws client
    console.log('Client trying to connect to ' + process.argv[3]);
    var WebSocket = require('ws');
    var wsc = new WebSocket('ws://' + process.argv[3]);

    wsc.binaryType = 'arraybuffer';
    wsc.onmessage = function(message) {
        recieveCount += 1;
        // logIncomingData(message.data, recieveCount, sockets.length);

        broadcastqueue.push(message.data);

        setTimeout(function() {
            broadcast();
        }, 2000);
    };
}

// routes
app.get('/', function (req,res){
  res.render('index', {
        title: 'WebSocket Livestream',
        teaser: 'A prototype application that provides push-based live streaming capabilities with WebSockets.'
    });
});
app.get('/stream', function(req, res) {
    res.render('stream', {
        title: 'WS Videostream',
        teaser: 'Videostream with WebSockets and MediaSource Plugin'
    });
});

// functions
function broadcast()
{
    sendCount += 1;
    // logOutgoingData(broadcastqueue[0], sendCount, sockets.length);

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
    console.log('Sending chunk of data: ' + count);
    console.log("Sending to " + socketLength + " sockets");
}

function logOutgoingData(data, count, socketLength)
{
    console.log("Type: " + typeof data + ", Size: " + data.length);
    console.log('Sending chunk of data: ' + count);
    console.log("Sending to " + socketLength + " sockets");
}