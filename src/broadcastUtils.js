exports.addToQueue = function(broadcastQueue, newSegment)
{
    for(var i=0; i<broadcastQueue.length; i++) {
        if(broadcastQueue[i] === newSegment)
            return;
    }

    broadcastQueue.push(newSegment);
    return;
};