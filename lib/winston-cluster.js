/*
 * winston-cluster.js: Transport for passing logs from cluster workers to the main process
 * for display and output to files.
 *
 * Based on the loggly.js transport by Charlie Robbins available at:
 * https://github.com/winstonjs/winston-loggly
 *
 * (C) 2010 Charlie Robbins
 * (C) 2015 Ryan Kurte
 *
 * MIT LICENCE
 *
 */
const Transport = require("winston-transport")
const cluster = require('cluster')
const winston = require('winston')

//
// Remark: This should be at a higher level.
//
const code = /\u001b\[(\d+(;\d+)*)?m/g;

module.exports = class Cluster extends Transport {
    constructor(opts, loggerName) {
        super(opts)
        this.name = "cluster"
        this.silent = opts.silent || false
        this.stripColors = opts.stripColors || true
        this.loggerName = loggerName || 'cluster_logger'
    }
    //
    // ### function bindListeners (instance)
    // Binds listeners to worker threads to collect log information
    // Instance is an optional logging instance to bind to
    // TODO: allow callback for non-logging events
    //
    static bindListeners(instance) {  
        for (var id in cluster.workers) {
           this.bindListener(cluster.workers[id], instance)
        }
    }

    //
    // ### function bindListener (worker, instance)
    // Binds the listener to worker threads to collect log information
    // worker is the worker instance to bind to
    // instance is an optional logger instance to bind to
    //
    static bindListener(worker, instance = null) {
        worker.on('message', (info) => {
            if (info.cmd && info.cmd === 'log') {
                
                var level = info.level;
                var message = info.msg;
                var meta = info.meta || { };
                meta.worker = info.worker;
                if (instance != null) {
                    instance.log(level, message, meta)
                } else {
                    winston.log(level, message, meta);
                }
            }
        });
    }

    static bindMultipleListeners(instances) {    
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', (info) => {
                if (info.cmd && info.cmd === 'log' && info.loggerName) {
                    var level = info.level;
                    var message = info.msg;
                    var meta = info.meta
                    meta.worker = info.worker || {};
                    instances
                      .filter(logger => {
                        return logger.name === info.loggerName;
                      })
                      .forEach(logger => {
                        logger.instance.log(level, message, meta);
                      });
                }
            });
        }
    }

    //
    // #### @info {Object} 
    // #### @callback {function} Continuation to respond to when complete.
    // Core logging method exposed to Winston. Metadata is optional.
    //
    log({level, message, ...meta}, callback) {
        if (this.silent) {
            return callback(null, true);
        }
    
        if (this.stripColors) {
            message = ('' + message).replace(code, '');
        }
        var message = {
            cmd: 'log',
            loggerName: this.loggerName,
            worker: cluster.worker.id,
            level: level,
            msg: message,
            meta: meta || {}
        };
        process.send(message);
    
        callback();
    }
}