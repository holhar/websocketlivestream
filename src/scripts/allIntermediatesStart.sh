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
    ttab -w ./serverStart.sh $1 intermediate 11
    ttab -w ./serverStart.sh $1 intermediate 12
    ttab -w ./serverStart.sh $1 intermediate 21
    ttab -w ./serverStart.sh $1 intermediate 22
    ttab -w ./serverStart.sh $1 intermediate 31
    ttab -w ./serverStart.sh $1 intermediate 32
else
    echo "Wrong argument provided"
    echo "One argument needed:"
    echo "- argument 1 must be 'local' or 'network'"
    exit 2
fi