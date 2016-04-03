var expect = require('chai').expect;
var broadcastUtils = require('../src/broadcastUtils');

describe('broadcastUtils', function()
{
    describe('queue-adder', function()
    {
        var newSegment = 'filename1';
        var broadcastQueue = ['filename0'];

        it('adds new segments to queue', function ()
        {
            broadcastUtils.addToQueue(broadcastQueue, newSegment);
            expect(broadcastQueue).to.deep.equal(['filename0', 'filename1']);
        });

        it('does not add the segment, if already in queue', function()
        {
            broadcastUtils.addToQueue(broadcastQueue, newSegment);
            expect(broadcastQueue).to.deep.equal(['filename0', 'filename1']);
        });
    });
});