# websocketlivestream

This project includes a prototype application that provides push-based live streaming capabilities with WebSockets. To emulate a livestream ingress a webcam stream is being captured, stored and transcoded in MPEG-DASH segments by using ffmpeg and mp4box.

The **app.js** contains the serverside-components of the prototype. The client-side equivalent can be found in **public/js**.

## Prerequisites

* npm
* ffmpeg
* mp4box

## Usage

* Change into the project's root-directory

* Install the necessary application dependencies via npm:

```
$ npm install
```

## Prototype

### WS-Video Livestream

This is a video livestream server over WebSockets - video is being played on the client side via the MediaSource-Plugin provided by the browser. **So far, the Firefox-API has been used**.

#### Workflow

The DASH-segments that are necessary for a functioning livestream are produced in three steps by **ffmpeg** and the **transcode.js**-script located in *res/dashsegments*. At first, the mp4-segments are produced automatically by ffmpeg and stored into the *mp4segments-folder*. After this process **mp4box** creates DASH-segments which are stored in the dashsegments-folder. 

To get the prototype running follow these three steps:

##### Start Webserver

From inside the project's root directory:

```
$ node app.js
```

##### Start Transcoding Script

Change into the dashsegments-folder:

```
$ cd res/dashsegments/
```

And start the transcoding script - you need mp4box installed for this:

```
$ node transcode.js
```

##### Webcam-Capture

Change into the webcamstream-folder:

```
$ cd res/webcamstream/
```

And start webcam-capture - you need ffmpeg installed for this:

```
$ ffmpeg -f qtkit -i "default" webcamout.mpg -map 0 -f ssegment -segment_list playlist.m3u8 -segment_list_flags +live -segment_time 10 webcam_part%03d.mpg
```

Note that I used the mac tool **qtkit** for capturing the webcam. Depending on the system you may use a slighty different command.