/*
    This setup includes:
        - 2 ingress server side by side
        - 4 intermediate, 2 server chained together a time
        - 1 edge server listening to both intermediate end-points
*/

var config = {};

// localhost Setup
config.localhost =  'localhost';

config.ingress = {};
config.intermediate1 = {};
config.intermediate2 = {};
config.edge = {};

// ports + wssUrls
config.ingress1.wssUrl  = '192.168.42.1';
config.ingress1.wssPort = '8001';

config.ingress2.wssUrl  = '192.168.42.2';
config.ingress2.wssPort = '8002';

config.intermediate1.wssUrl  = '192.168.42.11';
config.intermediate1.wssPort = '8011';
config.intermediate1.wsUrl   = config.ingress1.wssUrl;
config.intermediate1.wsPort  = config.ingress1.wssPort;

config.intermediate2.wssUrl  = '192.168.42.12';
config.intermediate2.wssPort = '8012';
config.intermediate2.wsUrl   = config.intermediate1.wssUrl;
config.intermediate2.wsPort  = config.intermediate1.wssPort;

config.intermediate3.wssUrl  = '192.168.42.13';
config.intermediate3.wssPort = '8013';
config.intermediate3.wsUrl   = config.ingress2.wssUrl;
config.intermediate3.WsPort  = config.ingress2.wssPort;

config.intermediate4.wssUrl  = '192.168.42.14';
config.intermediate4.wssPort = '8011';
config.intermediate4.wsUrl   = config.intermediate3.wssUrl;
config.intermediate4.WsPort  = config.intermediate3.wssPort;

config.edge.wssUrl  = '192.168.42.20';
config.edge.wssPort = '8020';
config.edge.wsUrl1  = config.intermediate2.wssUrl;
config.edge.wsPort1 = config.intermediate2.wssPort;
config.edge.wsUrl2  = config.intermediate4.wssUrl;
config.edge.wsPort2 = config.intermediate4.wssPort;

module.exports = config;