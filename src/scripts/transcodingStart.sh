#!/bin/bash
# this script starts the transcoding watcher
# one argument needed:
#   "- argument 1 must be 'local' or 'network'"

if [ -z $1 ]
then
    echo "Missing argument"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
elif [ $# -gt 3 ]
then
    echo "Too many arguments"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi

if [ "$1" = "local" -o "$1" = "network" ]
then
    cd ../data/dashsegments/
    node transcode.js $1
else
    echo "Wrong arguments provided"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi