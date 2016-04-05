/*
    Utilities for all WS-Server
*/

var broadcastUtils = {};


broadcastUtils.addToQueue = function(broadcastQueue, newSegment)
{
    for(var i=0; i<broadcastQueue.length; i++) {
        if(broadcastQueue[i] === newSegment)
            return;
    }

    broadcastQueue.push(newSegment);
    return;
};


module.exports = broadcastUtils;