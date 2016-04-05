#!/bin/bash
# this script starts an cdn ws-server instance
# three arguments needed:
#   "- argument 1 must be 'local' or 'network'"
#   "- argument 2 must be 'ingress', 'intermediate' or 'edge'"
#   "- argument 3 must be '1', '2', '3' or '4'"

if [ -z $1 ]
then
    echo "Missing arguments"
    echo "Three arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 must be 'ingress', 'intermediate' or 'edge'"
    echo "- argument 3 must be '1', '2', '3' or '4'"
    exit 2
elif [ $# -gt 3 ]
then
    echo "Too many arguments"
    echo "Three arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 must be 'ingress', 'intermediate' or 'edge'"
    echo "- argument 3 must be '1', '2', '3' or '4'"
    exit 2
fi

if [ "$1" = "local" -o "$1" = "network" -a "$2" = "ingress" -o "$2" = "intermediate" -o "$2" = "edge" -a "$3" = "1" -o "$3" = "2" -o "$3" = "3" -o "$3" = "4" ]
then
    echo "Starting $1 $2$3"
    cd ../
    node $2Server.js $1 $3
else
    echo "Wrong arguments provided"
    echo "Three arguments needed:"
    echo "- argument 1 must be 'local' or 'network'"
    echo "- argument 2 must be 'ingress', 'intermediate' or 'edge'"
    echo "- argument 3 must be '1', '2', '3' or '4'"
    exit 2
fi