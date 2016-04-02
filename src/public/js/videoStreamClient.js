(function() {

    if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="avc1.64001F"'))
    {
        window.MediaSource = window.MediaSource || window.WebKitMediaSource;

        // supported codecs: 'video/mp4; codecs="avc1.64001F"' / 'video/webm; codecs="vorbis,vp8"' / video/mp4; codecs=”avc1.42E01E,mp4a.40.2″
        var mediaSource = new MediaSource(),
            sourceBuffer,
            chunks = [],
            video = document.querySelector('video'),
            codecs = 'video/mp4; codecs="avc1.64001F"';
        video.src = window.URL.createObjectURL(mediaSource);

        mediaSource.addEventListener('sourceopen', sourceOpenCallback, false);
        mediaSource.addEventListener('webkitsourceopen', sourceOpenCallback, false);
        mediaSource.addEventListener('sourceended', sourceEndedCallback , false);
        mediaSource.addEventListener('webkitsourceended', sourceEndedCallback , false);
        mediaSource.addEventListener('sourceclose', sourceEndedCallback , false);
        mediaSource.addEventListener('webkitsourceclose', sourceEndedCallback , false);
    } else {
        console.log('MediaSource-Plugin or Codec not supported.');
    }

    function sourceOpenCallback(e)
    {
        // Adjust socket URL to host IP address
        var ws = new WebSocket('ws://' + window.location.host + '/stream');
        ws.binaryType = 'arraybuffer';
        sourceBuffer = mediaSource.addSourceBuffer(codecs);
        sourceBuffer.mode = 'sequence';
        addSourceBufferEvents();

        ws.onmessage = function(evt)
        {
            // logOnMessageData(evt.data.byteLength);
            chunks.push(new Uint8Array(evt.data));
            fillSourceBuffer();
        };

        ws.onclose = function() {
            console.log("Connection is closed...");
        };
    }

    function sourceEndedCallback(e)
    {
        console.log('Source ended');
    }

    function fillSourceBuffer()
    {
        if (!sourceBuffer.updating)
        {
            // logFillSourceBufferData();
            chunk = chunks.shift();
            if (typeof chunk !== 'undefined') {
                sourceBuffer.appendBuffer(chunk);
            }
            if (video.paused) {
                video.play();
            }
        }
        chunk = null;
    }

    function addSourceBufferEvents()
    {
        sourceBuffer.addEventListener('updatestart',         logUpdatingState('start') , false);
        sourceBuffer.addEventListener('webkitupdatestart',   logUpdatingState('start') , false);
        sourceBuffer.addEventListener('update',              logUpdatingState('still') , false);
        sourceBuffer.addEventListener('webkitupdate',        logUpdatingState('still') , false);
        sourceBuffer.addEventListener('updateend',           fillSourceBuffer , false);
        sourceBuffer.addEventListener('webkitupdateend',     fillSourceBuffer , false);
    }

    function onError(e)
    {
        console.log("Error: " + e);
    }

    // Logging functions for debugging
    function logOnMessageData(dataByteLength)
    {
        console.log(dataByteLength);
        console.log('Chunk-length in WS-onmessage: ' + chunks.length);
    }

    function logFillSourceBufferData()
    {
        console.log('chunk-länge am Anfang von fillSourceBuffer: ' + chunks.length);
    }

    function logUpdatingState(state) {
        console.log(state + ' updating');
    }

})();