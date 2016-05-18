# Prototype Startup

## Small-scale

### Ingress Device

* `$ cd path/to/websocketlivestream/src/scripts/`
* `$ node ../loggingServer.js network`
* `$ ./serverStart.sh network ingress 1`
* `$ ./serverStart.sh network ingress 2`

### Intermediate Device

* `$ cd path/to/websocketlivestream/src/scripts/`
* `$ ./serverStart.sh network intermediate 1`

### Edge Device

* `$ cd path/to/websocketlivestream/src/scripts/`
* `$ ./serverStart.sh network edge 1`

### Back on Ingress Device (Still in scripts-folder)

* `$ ./webcamStart.sh`
* `$ ./transcodingStart.sh network 1`