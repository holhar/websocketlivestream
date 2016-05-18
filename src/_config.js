/*
    This setup includes:
        - 2 ingress server side by side
        - 4 intermediate, 2 server chained together a time
        - 1 edge server listening to both intermediate end-points
*/

var config = {};

config.localhost = 'localhost';
config.livestream = true;

config.ingress1 = {};
config.ingress2 = {};
config.intermediate11 = {};
config.intermediate12 = {};
config.intermediate22 = {};
config.intermediate21 = {};
config.intermediate31 = {};
config.intermediate32 = {};
config.edge = {};
config.loggingServer = {};

config.filenames = {};
config.paths = {};

// wss urls + ports
// OB
config.ingress1.wssUrl  = '192.168.178.45';
config.ingress1.wssPort = '8001';

// OK
config.ingress2.wssUrl  = '192.168.178.37';
config.ingress2.wssPort = '8002';

// Pi2 - OK
config.intermediate11.wssUrl  = '192.168.178.44';
config.intermediate11.wssPort = '8011';
config.intermediate11.wsUrl   = config.ingress1.wssUrl;
config.intermediate11.wsPort  = config.ingress1.wssPort;
config.intermediate12.wssUrl  = '192.168.178.44';
config.intermediate12.wssPort = '8012';
config.intermediate12.wsUrl   = config.ingress2.wssUrl;
config.intermediate12.wsPort  = config.ingress2.wssPort;

// Pi2 - OB
config.intermediate21.wssUrl  = '192.168.178.39';
config.intermediate21.wssPort = '8013';
config.intermediate21.wsUrl   = config.intermediate11.wssUrl;
config.intermediate21.wsPort  = config.intermediate11.wssPort;
config.intermediate22.wssUrl  = '192.168.178.39';
config.intermediate22.wssPort = '8014';
config.intermediate22.wsUrl   = config.intermediate12.wssUrl;
config.intermediate22.wsPort  = config.intermediate12.wssPort;

// Pi2 - HH
config.intermediate31.wssUrl  = '192.168.178.47';
config.intermediate31.wssPort = '8015';
config.intermediate31.wsUrl   = config.intermediate21.wssUrl;
config.intermediate31.wsPort  = config.intermediate21.wssPort;
config.intermediate32.wssUrl  = '192.168.178.47';
config.intermediate32.wssPort = '8016';
config.intermediate32.wsUrl   = config.intermediate22.wssUrl;
config.intermediate32.wsPort  = config.intermediate22.wssPort;

// Pi3 - OK
config.edge.wssUrl  = '192.168.178.34';
config.edge.wssPort = '8020';
config.edge.wsUrl1  = config.intermediate31.wssUrl;
config.edge.wsPort1 = config.intermediate31.wssPort;
config.edge.wsUrl2  = config.intermediate32.wssUrl;
config.edge.wsPort2 = config.intermediate32.wssPort;

// HH
config.loggingServer.wssUrl = '192.168.178.43';
config.loggingServer.wssPort = '8900';

// filenames
config.filenames.mpgSegmentRegExp = /webcam_part\d+\.mpg/i;
config.filenames.mp4SegmentRegExp = /webcam_part\d+\.mp4/i;
config.filenames.dashSegmentRegExp = /webcam_part\d+_dashinit\.mp4/i;

// paths
config.paths.mpgSegmentPath = '../mpgsegments/';
config.paths.mp4SegmentPath = '../mp4segments/';
config.paths.dashSegmentPath = './';
config.paths.ingressDashSegmentPath = 'data/dashsegments/';

module.exports = config;