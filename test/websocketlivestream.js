var expect = require('chai').expect;
var websocketlivestream = require('../src/websocketlivestream');
var wsLivestream = new websocketlivestream();

describe('websocketlivestream', function()
{
    var socket1 = {name: 'socket1', url: 'ws://192.168.42.1', port: '8000'};
    var socket2 = {name: 'socket2', url: 'ws://192.168.42.1', port: '8000'};
    var newSegment = 'filename1';

    describe('addSocket', function()
    {
        it('adds a new socket to the sockets-array', function() {
            wsLivestream.addSocket(socket1);
            expect(wsLivestream.sockets).to.deep.equal([socket1]);
        });
    });

    describe('removeSocket', function()
    {
        it('removes a socket from the sockets-array', function() {
            wsLivestream.addSocket(socket2);
            wsLivestream.removeSocket(socket1);
            expect(wsLivestream.sockets).to.deep.equal([socket2]);
        });
    });

    describe('addNewSegmentToMpgSegmentQueue', function()
    {
        it('adds new segment to queue', function ()
        {
            wsLivestream.addNewSegmentToMpgSegmentQueue(newSegment);
            expect(wsLivestream.mpgSegmentQueue).to.deep.equal(['filename1']);
        });

        it('does not add the segment, if already in queue', function()
        {
            wsLivestream.addNewSegmentToBroadcastQueue(newSegment);
            expect(wsLivestream.mpgSegmentQueue).to.deep.equal(['filename1']);
        });
    });

    describe('addNewSegmentToMp4SegmentQueue', function()
    {
        it('adds new segment to queue', function ()
        {
            wsLivestream.addNewSegmentToMp4SegmentQueue(newSegment);
            expect(wsLivestream.mp4SegmentQueue).to.deep.equal(['filename1']);
        });

        it('does not add the segment, if already in queue', function()
        {
            wsLivestream.addNewSegmentToMp4SegmentQueue(newSegment);
            expect(wsLivestream.mp4SegmentQueue).to.deep.equal(['filename1']);
        });
    });

    describe('addNewSegmentToBroadcastQueue', function()
    {
        it('adds new segment to queue', function ()
        {
            wsLivestream.addNewSegmentToBroadcastQueue(newSegment);
            expect(wsLivestream.broadcastQueue).to.deep.equal(['filename1']);
        });

        it('does not add the segment, if already in queue', function()
        {
            wsLivestream.addNewSegmentToBroadcastQueue(newSegment);
            expect(wsLivestream.broadcastQueue).to.deep.equal(['filename1']);
        });
    });

    describe('removeFirstSegmentInArray', function()
    {
        it('removes the first entry from the mpg queue', function()
        {
            wsLivestream.addNewSegmentToMpgSegmentQueue('filename2');
            wsLivestream.removeFirstSegmentInArray('mpgSegmentQueue');
            expect(wsLivestream.mpgSegmentQueue).to.deep.equal(['filename2']);
        });

        it('removes the first entry from the mp4 queue', function()
        {
            wsLivestream.addNewSegmentToMp4SegmentQueue('filename2');
            wsLivestream.removeFirstSegmentInArray('mp4SegmentQueue');
            expect(wsLivestream.mp4SegmentQueue).to.deep.equal(['filename2']);
        });

        it('removes the first entry from the broadcast queue', function()
        {
            wsLivestream.addNewSegmentToBroadcastQueue('filename2');
            wsLivestream.removeFirstSegmentInArray('broadcastQueue');
            expect(wsLivestream.broadcastQueue).to.deep.equal(['filename2']);
        });
    });

    describe('updateLastBroadcastElement', function()
    {
        it('Sets the recently send segment equal to the first element in line', function()
        {
            wsLivestream.updateLastBroadcastElement();
            expect(wsLivestream.lastBroadcastElement).to.be.equal('filename2');
        });
    });
});