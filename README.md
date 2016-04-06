# websocketlivestream

## Table of Contents
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Workflow](#workflow)

## Introduction

Websocketlivestream provides video livestream capability over the WebSocket protocol. This repository presents a prototype including three types of WebSocket servers in a CDN-like scenario, as displayed in the figure below.

![Basic CDN Scheme](docs/res/cdn-scheme.png)

These three server types include:

* an **ingress server**, that captures the video feed (note that the ingress server can be modified to serve as an ingress and egde server in one),
* an **intermediate server** for passing the data flow between servers (intermediates can be randomly combined and support scalability), and
* an **edge server**, that feeds the video streams to clients and also presents an http client site (so far this server can provide up to two streams / ingresses).

There is an config file (**src/config.js**) that arranges the IP-addresses of the different devices. The file also indicates on which device which server should be running. The server startup must be following this configuration, unless the whole application shall be running locally - in this case only the ports must be matching. [See here](#startservers) for further details.

The incoming video stream can be emulated by a webcam stream, which is being captured, stored and transcoded in MPEG-DASH segments by using ffmpeg and mp4box.

The video is being played on the client side via the MediaSource-Plugin provided by the browser. **So far, the Firefox-API has been used**.

## Prerequisites <a id="prerequisites"></a>

* npm
* ffmpeg
* mp4box
* ttab (node module, that must be installed globally - only necessary, if you want to use the shell-script for opening multiple servers.)

### Installation <a id="installation"></a>

* Change into the project's root-directory
* Install the necessary application dependencies via npm:

```
$ npm install
```

### Workflow <a id="workflow"></a>

##### Change into scripts folder

```
$ cd src/scripts/
```

##### Start Transcoding Script

```
$ ./transcodingStart.sh
```

The script watches for changes in the **src/data/**-folders and transcodes mpg-segments into mp4-segments, and also transcodes mp4-segments into DASH-segments. **mp4box** is needed for this process.

##### Start Webcam-Capture

```
$ webcamStart.sh
```

**ffmpeg** needs to be installed for this and captures the webcam stream and automatically stores it as segments.
Note that I used the mac tool **qtkit** for capturing the webcam. Depending on the system in use, you may use a slighty different command.

##### Start the servers <a id="startservers"></a>

There are several different scripts for starting the servers:

* serverStart.sh
* allIntermediatesStart.sh
* firstIntermediatesStart.sh
* lastIntermediatesStart.sh

The first one is the most important script and starts an cdn ws-server instance. There are three three arguments needed to do so:
* argument 1 states if the server runs locally (for fast testing purposes) or in the cdn network; the argument must be 'local' or 'network'.
* argument 2 states which server to start and must be 'ingress', 'intermediate' or 'edge'.
* argument 3 must be '1', '2', '3' or '4' and tells which instance number to start (see **src/config.js**).

The other three script are mainly there for convenience purposes and should be pretty self-explanatory.