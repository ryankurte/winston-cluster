# winston-cluster

[![NPM Version](https://img.shields.io/npm/v/winston-cluster.svg)](https://www.npmjs.com/package/winston-cluster)
[![Build Status](https://travis-ci.org/ryankurte/jfsm.svg)](https://travis-ci.org/ryankurte/jfsm)
[![Dependency Status](https://david-dm.org/ryankurte/winston-cluster.svg)](https://david-dm.org/ryankurte/winston-cluster)

Winston transport for Node.js clustering.  
Uses IPC to send log information from cluster workers to the master process for file based or other single threaded logging.

## Usage
``` js
#!/usr/bin/env node

var cluster = require('cluster');
var winston = require('winston');
var winstonCluster = require('./lib/winston-cluster');

var logLevel = 'info';

if (cluster.isMaster) {

    // Create parent thread logger
    // Other transports (ie. file writing) should be bound to this
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: logLevel,
            }),
        ]
    });

    // Start child threads
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    // Bind event listeners to child threads using the local logger instance
    winstonCluster.bindListeners(logger);

    // Logging works as normal in the main thread
    logger.info("Started server!")

    // Server thread logic here
    // ...

} else {

    // Create a new logger instance for the child thread using the cluster transport to
    // send data back to the parent thread.
    // Note that log level must also be set here to avoid filtering prior to sending logs back
    var logger = new (winston.Logger)({transports: [
        new (winston.transports.Cluster)({
            level: logLevel,
        }),
    ]})

    // Logging in this instance now passed via IPC back to the parent
    // (and tagged with the worker thread ID)
    logger.info("Test Message!")

    // Client thread logic here
    // ...

}
```

## TODO
 - [ ] Write tests (check message passing works between threads)
 - [ ] Refactor names of messages structures (maybe add a prototype)
 - [ ] Allow bypass for other callbacks on non log messages
 
