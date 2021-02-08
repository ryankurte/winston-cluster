/*
 * winston-cluster.js: Transport for passing logs from cluster workers to the main process
 * for display and output to files.
 *
 * Based on the loggly.js transport by Charlie Robbins available at:
 * https://github.com/winstonjs/winston-loggly
 *
 * (C) 2010 Charlie Robbins
 * (C) 2015 Ryan Kurte
 * (C) 2019 Ralph Schuler
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

    static BaseLogger;

    /**
    * Winston Cluster Log Transporter
    * @param {Object} opts - Winston Transport opts
    * @param {String=} loggerName - Logger Name
    */
    constructor(opts, loggerName = null) {
        super(opts)
        this.name = "cluster"
        this.silent = opts.silent || false
        this.stripColors = opts.stripColors || true
        this.loggerName = loggerName || 'cluster_logger'
    }
       
    /**
    * Core logging method exposed to Winston. Metadata is optional.    * 
    * TODO: allow callback for non-logging events
    * @param {Winston.logger} logger - Winston Logger Instance
    */
    static bindListeners(logger) {  
        for (var id in cluster.workers) {
           this.bindListener(cluster.workers[id], logger)
        }
    }

    /**
    * Binds the listener to worker threads to collect log information
    * worker is the worker instance to bind to
    * instance is an optional logger instance to bind to
    * @param {Worker} worker - Cluster Worker
    * @param {Winston.logger=} logger - Winston Logger Instance
    */
    static bindListener(worker, logger = null) {
        worker.on('message', (info) => {
            if (info.cmd && info.cmd === 'log') {
                
                var level = info.level;
                var message = info.msg;
                var meta = info.meta || { };
                meta.worker = info.worker;
				meta.loggerName = info.loggerName;
                if (logger != null) {
                    logger.log(level, message, meta)
                } else {
                    winston.log(level, message, meta);
                }
            }
        });
    }

    /**
    * Binds the listener to a worker thread to collect log information
    * @param {Winston.Logger[]} loggers - Winston Logger Instances
    */
    static bindMultipleListeners(loggers) {    
        for (var id in cluster.workers) {
            cluster.workers[id].on('message', (info) => {
                if (info.cmd && info.cmd === 'log' && info.loggerName) {
                    var level = info.level;
                    var message = info.msg;
                    var meta = info.meta
                    meta.worker = info.worker || {};
                    loggers
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

    /**
    * Sets the Winston logger Instance
    * @param {Winston.logger} logger - Logger instance
    */
    static setBaseLogger(logger) {
        Cluster.BaseLogger = logger;
    }

    /**
    * Core logging method exposed to Winston. Metadata is optional.
    * @param {String} level - Log Level
    * @param {String} message - Log Message
    * @param {Object=} meta - Log Metadata
    * @return {Promise}
    */
    log(level, message, meta = {}) {
        return new Promise(resolve => {
            if (this.silent) {
                return resolve(null, true);
            }
        
            if (this.stripColors) {
                message = ('' + message).replace(code, '');
            }
            
            if (cluster.isMaster && Cluster.BaseLogger) {
                meta.loggerName = this.loggerName;
                Cluster.BaseLogger.loh(level, message, meta);
            } else if (cluster.isWorker) {
                var message = {
                    cmd: 'log',
                    loggerName: this.loggerName,
                    worker: cluster.worker.id,
                    level: level,
                    msg: message,
                    meta: meta || {}
                };
            
                process.send(message);
            }
        
            resolve();
        })
    }
}