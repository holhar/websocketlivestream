#!/bin/bash
cd ../data/webcamstream/
sudo ffmpeg -f v4l2 -video_size 640x480 -i /dev/video0 webcamout.mpg -map 0 -f ssegment -segment_list playlist.m3u8 -segment_list_flags +live -segment_time 3 webcam_part%03d.mpg