var exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs'),
    ffmpeg = require('fluent-ffmpeg'),
    _ = require('underscore');

// paths
// place this file in the DASH segment directory - then start the script
var webcamStreamPath = '../webcamstream/',
    mp4SegmentsPath = '../mp4segments/',
    dashsegmentsPath = './';

console.log('Start watching following folders:');
console.log('- ' + webcamStreamPath);
console.log('- ' + mp4SegmentsPath);

// helper vars
var transcodeToMp4Queue = [],
    transcodeToDASHQueue = [],
    isTranscodingToMp4 = false,
    isTranscodingToDASH = false;

// catch every new mpg-segment and transcode it to mp4
fs.watch(
    webcamStreamPath,
    {
        persistent: true,
        interval: 1000
    },
    function(curr, prev)
    {
        addToQueue( getMostRecentFile( webcamStreamPath, /webcam_part\d+\.mpg/i ), transcodeToMp4Queue );
        if(!isTranscodingToMp4) {
            transcodeToMp4();
        }
    }
);

// catch every new mp4-segment and pack it to DASH
fs.watch(
    mp4SegmentsPath,
    {
        persistent: true,
        interval: 1000
    },
    function(curr, prev)
    {
        addToQueue( getMostRecentFile( mp4SegmentsPath, /webcam_part\d+\.mp4/i ), transcodeToDASHQueue );
        transcodeToDASH();
    }
);

function transcodeToMp4() {
    isTranscodingToMp4 = true;
    segment = webcamStreamPath + transcodeToMp4Queue[0];
    mp4filename = transcodeToMp4Queue[0].split('.')[0];

    var command = ffmpeg(segment)
        .output(mp4SegmentsPath + mp4filename + '.mp4')
        .on('end', function() {
            console.log('finished MP4 transcoding; segment: ' + segment);
            transcodeToMp4Queue.shift();
            isTranscodingToMp4 = false;
        })
        .on('error', function(err) {
            console.log('an error occured: ' + err.message);
        })
        .run();
}

function transcodeToDASH() {
    segment = mp4SegmentsPath + transcodeToDASHQueue[0];
    dashFilename = transcodeToDASHQueue[0].split('.')[0];

    exec('mp4box -dash 1500 -frag 500 -rap ' + segment, puts);

    setTimeout(function() {
        transcodeToDASHQueue.shift();
    }, 2000);
}

function addToQueue(MostRecentFile, transcodingQueue) {
    var match = 0;

    if(transcodingQueue.length === 0) {
        transcodingQueue.push(MostRecentFile);
    } else {
        for(var i=0; i<transcodingQueue.length;i++) {
            if (transcodingQueue[i] === MostRecentFile) {
                match = 1;
            }
        }
        if(match === 0) {
            transcodingQueue.push(MostRecentFile);
        }
    }
}

// Return only base file name without dir
function getMostRecentFile(dir, regexp) {
    var files = fs.readdirSync(dir);
    var mpgSegments = [];
    var match = '';

    for(var i=0; i<files.length; i++) {
        if(files[i].match( regexp )) {
            match = files[i].match( regexp );
            mpgSegments.push( match[0] );
        }
    }

    // use underscore for max()
    return _.max(mpgSegments, function (f) {
        var fullpath = path.join(dir, f);

        // ctime = creation time is used
        // replace with mtime for modification time
        return fs.statSync(fullpath).ctime;
    });
}

function puts(error, stdout, stderr) {
    console.log(stdout);
}