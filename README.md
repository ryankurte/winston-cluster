# winston-cluster

[![Build Status](https://travis-ci.org/ryankurte/jfsm.svg)](https://travis-ci.org/ryankurte/jfsm)
[![Dependency Status](https://david-dm.org/ryankurte/winston-cluster.svg)](https://david-dm.org/ryankurte/winston-cluster)

Winston transport for Node.js clustering.  
Uses IPC to send log information from cluster workers to the master process for file based or other single threaded logging.

## Usage
``` js

var cluster = require('cluster');
var winston = require('winston');
var winstonCluster = require('winston-cluster');

if (cluster.isMaster) {

    //Setup logging here
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        'timestamp': true,
        'colorize': true
    });
    winston.add(winston.transports.DailyRotateFile, {
        'timestamp': true,
        'datePattern': '.yyyy-MM-dd',
        'filename': 'application.log'
    });

    //Start workers
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    //Bind logging listeners to workers
    winstonCluster.bindListeners();

    //Master logic here
    //...

} else {

    //Replace default transport with cluster transport
    winstonCluster.bindTransport();

    winston.info("Test Message!")

    //Slave logic here
    //...

}

```

## TODO
 - [ ] Write tests (check message passing works between threads)
 - [ ] Refactor names of messages structures (maybe add a prototype)
 - [ ] Allow bypass for other callbacks on non log messages
 
