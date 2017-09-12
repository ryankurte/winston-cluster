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

var events = require('events');
var util = require('util');
var winston = require('winston');
var cluster = require('cluster');
var Stream = require('stream').Stream;

//
// Remark: This should be at a higher level.
//
var code = /\u001b\[(\d+(;\d+)*)?m/g;

//
// ### function Cluster (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Cluster transport object responsible
// for passing log information to the main process for logging
//
var Cluster = exports.Cluster = function(options) {
    options = options || {};

    winston.Transport.call(this, options);

    this.name = 'cluster';
    this.options = options;
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Cluster, winston.Transport);

//
// Define a getter so that `winston.transports.Cluster`
// is available and thus backwards compatible.
//
winston.transports.Cluster = Cluster;

//
// Expose the name of this Transport on the prototype
//
Cluster.prototype.name = 'cluster';

//
// ### function bindListeners (options)
// Binds listeners to worker threads to collect log information
// TODO: allow callback for non-logging events
//
var bindListeners = exports.bindListeners = function(options) {
    function messageHandler(msg) {
        if (msg.cmd && msg.cmd === 'log') {
            
            var level = msg.level;
            var message = msg.msg;
            var meta = msg.meta || { };
            meta.worker = msg.worker;

            winston.log(level, message, meta);
        }
    }

    for (var id in cluster.workers) {
        var worker = cluster.workers[id];
        worker.on('message', messageHandler);
    }
}

//
// ### function bindTransport (options)
// Removes the default transport and binds the cluster transport to a given thread
//
var bindTransport = exports.bindTransport = function(options) {
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Cluster, options || {});
}

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Cluster.prototype.log = function(level, msg, meta, callback) {
    if (this.silent) {
        return callback(null, true);
    }

    if (this.stripColors) {
        msg = ('' + msg).replace(code, '');
    }

    var message = {
        cmd: 'log',
        worker: cluster.worker.id,
        level: level,
        msg: msg,
        meta: meta
    };

    process.send(message);

    this.emit('logged');

    callback(null, true);

    return message;
};

//TODO: can I remove the following stubs?

//
// ### function _write (data, cb)
// #### @data {String|Buffer} Data to write to the instance's stream.
// #### @cb {function} Continuation to respond to when complete.
// Write to the stream, ensure execution of a callback on completion.
//
Cluster.prototype._write = function(data, callback) {

};

//
// ### function query (options, callback)
// #### @options {Object} Loggly-like query options for this instance.
// #### @callback {function} Continuation to respond to when complete.
// Query the transport. Options object is optional.
//
Cluster.prototype.query = function(options, callback) {

};

//
// ### function stream (options)
// #### @options {Object} Stream options for this instance.
// Returns a log stream for this transport. Options object is optional.
//
Cluster.prototype.stream = function(options) {

};

//
// ### function open (callback)
// #### @callback {function} Continuation to respond to when complete
// Checks to see if a new file needs to be created based on the `maxsize`
// (if any) and the current size of the file used.
//
Cluster.prototype.open = function(callback) {
    callback();
};

//
// ### function close ()
// Closes the stream associated with this instance.
//
Cluster.prototype.close = function() {
    var self = this;
};

//
// ### function flush ()
// Flushes any buffered messages to the current `stream`
// used by this instance.
//
Cluster.prototype.flush = function() {
    var self = this;
};
