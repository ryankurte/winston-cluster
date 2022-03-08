#!/usr/bin/env node

var winston = require("winston");
var WinstonCluster = require("../lib/winston-cluster.js").WinstonCluster;

var logger = winston.createLogger({
  transports: [
    new WinstonCluster(
      {
        level: "info",
      },
      "test-logger"
    ),
  ],
});

var run = (exports.run = function () {
  var i = 0;

  process.on("message", function (message) {
    if (message.type === "log") {
      logger.log(message.level, message.message, message.meta, callback);
    } else if (message.type === "shutdown") {
      process.exit(0);
    }
  });

  return 0;
});

var callbackDone = false;

var getCallbackDone = (exports.getCallbackDone = function () {
  return callbackDone;
});

var clearCallbackDone = (exports.clearCallbackDone = function () {
  callbackDone = false;
});

function callback() {
  callbackDone = true;
}

run();
