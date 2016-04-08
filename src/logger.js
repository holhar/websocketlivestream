/*
    Logging object
*/

var logger = {

    logWsServerPortListen: function(port)
    {
        console.log('server running and listening to port ' + port);
    },

    logWebserverURL: function(url, port)
    {
        console.log('webserver URL: ' + url + ':' + port);
    },

    logWsClientStartup: function(url, port)
    {
        console.log('ws-client connecting to ws-server: ' + url + ':' + port);
    },

    logNewServerInstance: function(serverId)
    {
        console.log('init ws-server instance ' + serverId);
    },

    logNewClientConnection: function(wsClientUrl)
    {
        console.log('new ws-client connected: ' + wsClientUrl);
    },

    logIncomingMessage: function(message)
    {
        console.log('new message from client: ' + message);
    },

    logWatcherStartup: function()
    {
        console.log('starting Watcher');
    },

    logConnectionCheckup: function()
    {
        console.log('check for open connections');
    },

    logIncomingVideoData: function(receiveCount, videoData)
    {
        console.log('type: ' + typeof videoData + ', size: ' + videoData.length);
        console.log('receiving chunk of data: ' + receiveCount);
    },

    logOutgoingVideoData: function(sendCount, videoData)
    {
        console.log('type: ' + typeof videoData + ', size: ' + videoData.length);
        console.log('sending chunk of data: ' + sendCount);
    },

    logSegmentBroadcasting: function(segment)
    {
        console.log('Broadcasting segment: ' + segment);
    },

    logTranscodingStartup: function(webcamStreamPath, mp4SegmentsPath)
    {
        console.log('Start watching following folders:');
        console.log('- ' + webcamStreamPath);
        console.log('- ' + mp4SegmentsPath);
    }

};

module.exports = logger;