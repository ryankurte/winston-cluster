var assert = require('assert');
var promise = require('promise');
var winston = require('winston');
var os = require('os');
var cluster = require('cluster');

var winstonCluster = require('../lib/winston-cluster');

//TODO: how to test with clustering ..?

//Datastore testing
describe('Winston Cluster Tests', function() {

    before(function(done) {

        cluster.setupMaster({
            exec: './test/test-worker.js'
        });

        var cpuCount = os.cpus().length;

        for (var i = 0; i < cpuCount; i++) {
            cluster.fork();
        }

        done();
    });

    after(function(done) {
        for (var id in cluster.workers) {
            var worker = cluster.workers[id];

            worker.send('shutdown');
            worker.disconnect();
            timeout = setTimeout(function() {
                worker.kill();
            }, 2000);
        }

        done();
    });

    it("is cluster master", function(done) {
        assert.equal(true, cluster.isMaster);
        done();
    });

    it("can bind to cluster threads", function(done) {
        done();
    });

    it("can send log events from slave to master", function(done) {
        var promises = [];

        for (var id in cluster.workers) {
            var worker = cluster.workers[id];

            var p = new promise(function(resolve, reject) {

                //Setup message
                var message = {
                    cmd: 'log',
                    loggerName: 'test-logger',
                    level: 'info',
                    msg: 'test message',
                    meta: {
                        test: 'wooo'
                    }
                };

                //Bind handler
                worker.on('message', function(msg) {
                    assert.equal(message.cmd, msg.cmd);
                    assert.equal(message.loggerName, msg.loggerName);
                    assert.equal(message.level, msg.level);
                    assert.equal(message.msg, msg.msg);
                    assert.equal(message.meta.test, msg.meta.test);

                    //Remove handler
                    worker.on('message', function(msg) {});

                    resolve();
                });

                //Send message to worker to cause worker to write to winston instance
                worker.send(message);
            });

            promises.push(p);
        }

        promise.all(promises)
            .then(function() {
                done();
            });
    });

});