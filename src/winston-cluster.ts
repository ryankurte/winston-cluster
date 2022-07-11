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
import winston, { Logger } from "winston";
import TransportStream, { TransportStreamOptions } from "winston-transport";
import cluster, { Worker } from "cluster";

export interface WinstonClusterOptions extends TransportStreamOptions {
  stripColors?: boolean;
}
export class WinstonCluster extends TransportStream {
  static BaseLogger: Logger;

  private loggerName: string;
  private stripColors: boolean;

  /**
   * Winston Cluster Log Transporter
   * @param {WinstonClusterOptions} options Options for the transport
   * @param {String?} loggerName Name of the cluster logger
   */
  constructor(options: WinstonClusterOptions, loggerName?: string) {
    super(options);
    this.loggerName = loggerName || "default";
    this.silent = options.silent || false;
    this.stripColors = options.stripColors || true;
  }

  /**
   * Core Logging method exposed to Winston.
   * @param {Logger|Logger[]} loggers Logger or array of loggers to log to
   */
  public static bindListeners(loggers: Logger | Logger[]) {
    for (const workerId in cluster.workers) {
      const worker = cluster.workers[workerId];
      if (!worker || worker.isDead()) continue;
      this.bindListener(loggers, worker);
    }
  }

  /**
   * Binds a listener or a array of listeners to a worker
   * @param {Logger|Logger[]} loggers Logger or array of loggers to log to
   * @param {String} workerId Id of the worker to bind to
   */
  public static bindListener(
    loggers: Logger | Logger[] | undefined,
    worker: Worker
  ) {
    const loggerList = loggers
      ? Array.isArray(loggers)
        ? loggers
        : [loggers]
      : [];
    worker.on("message", (payload: any) => {
      if (!payload.type || payload.type !== "log") return;
      const { level, content, meta } = payload;
      const newMeta = {
        ...meta,
        workerId: worker.id,
      };

      if (!loggers) winston.log(level, content, newMeta);
      else
        loggerList
          .filter((logger) => {
            return logger.name === payload.loggerName;
          })
          .forEach((logger) => {
            logger.log(level, payload, meta);
          });
    });
  }

  /*
   * Sets the Winston logger Instance
   * @param {Logger} logger - Logger instance
   */
  public static setBaseLogger(logger: Logger) {
    WinstonCluster.BaseLogger = logger;
  }

  /**
   * Core logging method exposed to Winston. Metadata is optional.
   * @param {String} level - Log Level
   * @param {String} message - Log Message
   * @param {Object} meta - Log Metadata
   * @return {Promise}
   */
  log(payload: any, callback: Function) {
    if (this.silent) return callback(null, true);
    let { level, message, ...meta } = payload;
    if (this.stripColors)
      message = ("" + message).replace(/\u001b\[(\d+(;\d+)*)?m/g, "");
    meta.loggerName = this.loggerName;
    if (!cluster.isWorker && WinstonCluster.BaseLogger)
      WinstonCluster.BaseLogger.log(level, message, meta);
    else if (cluster.isWorker) {
      // @ts-ignore
      process.send({
        type: "log",
        loggerName: this.loggerName,
        level: level,
        msg: message,
        meta: meta,
        // @ts-ignore
        workerId: cluster.worker.id,
      });
    }
  }
}

export default WinstonCluster;
