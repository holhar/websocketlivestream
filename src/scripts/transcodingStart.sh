#!/bin/bash
# this script starts the transcoding watcher
# two arguments needed:
#   "- argument 1 must be 'local' or 'network'"
#   "- argument 2 is the instance number of the transcoder"

if [ -z $2 ]
then
    echo "Missing arguments"
    echo "Two arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 is the instance number of the transcoder"
    exit 2
elif [ $# -gt 2 ]
then
    echo "Too many arguments"
    echo "Two arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 is the instance number of the transcoder"
    exit 2
fi

if [ "$1" = "local" -o "$1" = "network" -a "$2" = "1" -o "$2" = "2" ]
then
    cd ../data/dashsegments/
    node transcode.js $1 $2
else
    echo "Wrong arguments provided"
    echo "Two arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 is the instance number of the transcoder"
    exit 2
fi