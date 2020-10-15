import * as transportStream from 'winston-transport';
import * as cluster from 'cluster';

declare namespace winstonCluster {
  interface Cluster extends transportStream {
    masterLogger: winston.Logger;

    name: string;
    silent: boolean;
    stripColors: boolean;
    loggerName: string;

    bindListeners(instance: winston.Logger): void;
    bindListener(worker: cluster.Worker, instance: winston.Logger): void;
    bindMultipleListeners(instances: winston.Logger[]): void;
    setMasterLogger(instance: winston.Logger): void;
    log(info: any, callback: Function): void;

    new(opts: transportStream.TransportStreamOptions, loggerName?: string): Cluster;
  }
}
declare const winstonCluster: winstonCluster.Cluster;
export = winstonCluster;