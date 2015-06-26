#!/usr/bin/env node

var cluster = require('cluster');
var winston = require('winston');
var winstonCluster = require('../lib/winston-cluster');

winstonCluster.bindTransport();

var run = exports.run = function() {
	var i = 0;

	process.on('message', function(message) {
		if(message.cmd === 'log') {
			winston.log(message.level, message.msg, message.meta, callback);
		} else if(message.cmd === 'shutdown') {
			process.exit(0);
		}
	});

	return 0;
}

var callbackDone = false;

var getCallbackDone = exports.getCallbackDone = function() {
	return callbackDone;
}

var clearCallbackDone = exports.clearCallbackDone = function() {
	callbackDone = false;
}

function callback() {
	callbackDone = true;
}
	
run();

