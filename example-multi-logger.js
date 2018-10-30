#!/usr/bin/env node

var cluster = require('cluster');
var winston = require('winston');
var winstonCluster = require('./lib/winston-cluster');

var logLevel = 'info';

if (cluster.isMaster) {

    // For multiple logger instances, they should be provided names.  Those
    // names need to be passed into the Cluster prototype, as well as the 
    // binding.
    var firstLoggerName = 'first-logger';
    var secondLoggerName = 'second-logger';

    // Create parent thread logger
    // Other transports (ie. file writing) should be bound to this
    var firstLogger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: logLevel,
            }, firstLoggerName),
        ]
    });

    var secondLogger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({
                level: logLevel,
            }, secondLoggerName),
        ]
    });

    // Start child threads
    var cpuCount = require('os').cpus().length;
    for (var i = 0; i < cpuCount; i++) {
        cluster.fork();
    }

    // Bind event listeners to child threads using the local logger instance
    winstonCluster.bindMultipleListeners([
        { logger: firstLogger, loggerName: firstLoggerName },
        { logger: secondLogger, loggerName: secondLoggerName}
    ]);

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