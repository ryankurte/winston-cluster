import * as transportStream from 'winston-transport';
import * as cluster from 'cluster';

declare namespace winstonCluster {
  interface Cluster extends transportStream {
    name: string;
    silent: boolean;
    stripColors: boolean;
    loggerName: string;

    bindListeners(instance: any): void;
    bindListener(worker: cluster.Worker, instance: any): void;
    bindMultipleListeners(instances: any[]): void;
    log(info: any, callback: Function): void;

    new(opts: transportStream.TransportStreamOptions, loggerName?: string): Cluster;
  }
}
declare const winstonCluster: winstonCluster.Cluster;
export = winstonCluster;