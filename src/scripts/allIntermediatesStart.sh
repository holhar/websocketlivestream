#!/bin/bash
# this script starts all intermediate instances and is especially useful if you want to run all instances on one machine in the network
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
    ttab -w ./serverStart.sh $1 intermediate 3
    ttab -w ./serverStart.sh $1 intermediate 4
else
    echo "Wrong argument provided"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi