"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonCluster = void 0;
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
var winston_1 = __importDefault(require("winston"));
var winston_transport_1 = __importDefault(require("winston-transport"));
var cluster_1 = __importDefault(require("cluster"));
var WinstonCluster = /** @class */ (function (_super) {
    __extends(WinstonCluster, _super);
    /**
     * Winston Cluster Log Transporter
     * @param {WinstonClusterOptions} options Options for the transport
     * @param {String?} loggerName Name of the cluster logger
     */
    function WinstonCluster(options, loggerName) {
        var _this = _super.call(this, options) || this;
        _this.loggerName = loggerName || "default";
        _this.silent = options.silent || false;
        _this.stripColors = options.stripColors || true;
        return _this;
    }
    /**
     * Core Logging method exposed to Winston.
     * @param {Logger|Logger[]} loggers Logger or array of loggers to log to
     */
    WinstonCluster.bindListeners = function (loggers) {
        for (var workerId in cluster_1.default.workers) {
            var worker = cluster_1.default.workers[workerId];
            if (!worker || worker.isDead())
                continue;
            this.bindListener(loggers, worker);
        }
    };
    /**
     * Binds a listener or a array of listeners to a worker
     * @param {Logger|Logger[]} loggers Logger or array of loggers to log to
     * @param {String} workerId Id of the worker to bind to
     */
    WinstonCluster.bindListener = function (loggers, worker) {
        var loggerList = loggers
            ? Array.isArray(loggers)
                ? loggers
                : [loggers]
            : [];
        worker.on("message", function (payload) {
            if (!payload.type || payload.type !== "log")
                return;
            var level = payload.level, content = payload.content, meta = payload.meta;
            var newMeta = __assign(__assign({}, meta), { workerId: worker.id });
            if (!loggers)
                winston_1.default.log(level, content, newMeta);
            else
                loggerList
                    .filter(function (logger) {
                    return logger.name === payload.loggerName;
                })
                    .forEach(function (logger) {
                    logger.log(level, payload, meta);
                });
        });
    };
    /*
     * Sets the Winston logger Instance
     * @param {Logger} logger - Logger instance
     */
    WinstonCluster.setBaseLogger = function (logger) {
        WinstonCluster.BaseLogger = logger;
    };
    /**
     * Core logging method exposed to Winston. Metadata is optional.
     * @param {String} level - Log Level
     * @param {String} message - Log Message
     * @param {Object} meta - Log Metadata
     * @return {Promise}
     */
    WinstonCluster.prototype.log = function (payload, callback) {
        if (this.silent)
            return callback(null, true);
        var level = payload.level, message = payload.message, meta = __rest(payload, ["level", "message"]);
        if (this.stripColors)
            message = ("" + message).replace(/\u001b\[(\d+(;\d+)*)?m/g, "");
        meta.loggerName = this.loggerName;
        if (!cluster_1.default.isWorker && WinstonCluster.BaseLogger)
            WinstonCluster.BaseLogger.log(level, message, meta);
        else if (cluster_1.default.isWorker) {
            // @ts-ignore
            process.send({
                type: "log",
                loggerName: this.loggerName,
                level: level,
                msg: message,
                meta: meta,
                // @ts-ignore
                workerId: cluster_1.default.worker.id,
            });
        }
    };
    return WinstonCluster;
}(winston_transport_1.default));
exports.WinstonCluster = WinstonCluster;
exports.default = WinstonCluster;
