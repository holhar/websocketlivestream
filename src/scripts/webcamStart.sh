#!/bin/bash
cd ../data/mpgsegments/
ffmpeg -f qtkit -i "default" webcamout.mpg -map 0 -f ssegment -segment_list playlist.m3u8 -segment_list_flags +live -segment_time 3 webcam_part%03d.mpg
