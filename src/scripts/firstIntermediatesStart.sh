#!/bin/bash
# this script starts the first two intermediate instances, as they are should run on one machine, 'local' or 'network' can be provided
# one arguments needed:
#   "- argument 1 must be 'local' or 'network'"

if [ -z $1 ]
then
    echo "Missing argument"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
elif [ $# -gt 1 ]
then
    echo "Too many arguments"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi

if [ "$1" = "local" -o "$1" = "network" ]
then
    ttab -w ./serverStart.sh $1 intermediate 1
    ttab -w ./serverStart.sh $1 intermediate 2
else
    echo "Wrong argument provided"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi