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
config.edge = {};
config.loggingServer = {};

config.filenames = {};
config.paths = {};

// wss urls + ports
config.loggingServer.wssUrl = '192.168.180.46';
config.loggingServer.wssPort = '8900';

config.ingress1.wssUrl  = '192.168.180.46';
config.ingress1.wssPort = '8001';
config.ingress2.wssUrl  = '192.168.180.46';
config.ingress2.wssPort = '8002';

config.intermediate11.wssUrl  = '192.168.180.50';
config.intermediate11.wssPort = '8011';
config.intermediate11.wsUrl   = config.ingress1.wssUrl;
config.intermediate11.wsPort  = config.ingress1.wssPort;
config.intermediate12.wssUrl  = '192.168.180.50';
config.intermediate12.wssPort = '8012';
config.intermediate12.wsUrl   = config.ingress2.wssUrl;
config.intermediate12.wsPort  = config.ingress2.wssPort;

config.edge.wssUrl  = '192.168.180.22';
config.edge.wssPort = '8020';
config.edge.wsUrl1  = config.intermediate11.wssUrl;
config.edge.wsPort1 = config.intermediate11.wssPort;
config.edge.wsUrl2  = config.intermediate12.wssUrl;
config.edge.wsPort2 = config.intermediate12.wssPort;

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