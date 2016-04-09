(function()
{
'use strict';

/*!
 * Logger: Logging data to one console
 * Copyright(c) 2016 Holger Harms <kontakt@hash-developer.de>
 * MIT Licensed
 */

/**
 * Logger object
 *
 * @constructor
 * @api public
 */
function Logger() {}

Logger.prototype.logServerURL = function(name, url, port)
{
    var message = name + ': server running - URL: ' + url + ':' + port;
    console.log(message);
    return message;
};

Logger.prototype.logWsClientStartup = function(name, url, port)
{
    var message = name + ': ws-client connecting to ws-server: ' + url + ':' + port;
    console.log(message);
    return message;
};

Logger.prototype.logNewServerInstance = function(name, serverId)
{
    var message = name + ': init ws-server instance ' + serverId;
    console.log(message);
    return message;
};

Logger.prototype.logNewClientConnection = function(name, wsClientUrl)
{
    var message = name + ': new ws-client connected';
    console.log(message);
    return message;
};

Logger.prototype.logIncomingMessage = function(name, clientMessage)
{
    var message = name + ': new message from client: ' + clientMessage;
    console.log(message);
    return message;
};

Logger.prototype.logWatcherStartup = function(name)
{
    var message = name + ': starting Watcher';
    console.log(message);
    return message;
};

Logger.prototype.logConnectionCheckup = function(name)
{
    var message = name + ': check for open connections';
    console.log(message);
    return message;
};

Logger.prototype.logIncomingVideoData = function(name, receiveCount, videoData)
{
    var message = name + ': type: ' + typeof videoData + ', size: ' + videoData.length + ', receiving chunk of data: ' + receiveCount;
    console.log(message);
    return message;
};

Logger.prototype.logOutgoingVideoData = function(name, sendCount, videoData)
{
    var message = name + ': type: ' + typeof videoData + ', size: ' + videoData.length + ', sending chunk of data: ' + sendCount;
    console.log(message);
    return message;
};

Logger.prototype.logSegmentBroadcasting = function(name, segment)
{
    var message = name + ': Broadcasting segment: ' + segment;
    console.log(message);
    return message;
};

Logger.prototype.logTranscodingStartup = function(name, webcamStreamPath, mp4SegmentsPath)
{
    var message = name + ': Start watching following folders:\n - ' + webcamStreamPath + '\n - ' + mp4SegmentsPath;
    console.log(message);
    return message;
};

Logger.prototype.logTranscodingOfSegment = function(name, segment)
{
    var message = name + ': transcoding dash-segment: ' + segment;
    console.log(message);
    return message;
};

module.exports = Logger;

}());