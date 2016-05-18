#!/bin/bash
cd ../data/mpgsegments/
ffmpeg -f qtkit -i "default" -r 25 -qscale:v 2 -maxrate 8000k -bufsize 24000k webcamout.mpg -map 0 -f segment -segment_list playlist.m3u8 -segment_list_flags +live -segment_time 3 webcam_part%03d.mpg