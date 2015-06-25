var assert = require('assert');
var winston = require('winston');

var winstonCluster = require('../lib/winston-cluster');

//TODO: how to test with clustering ..?

//Datastore testing
describe('Winston Cluster Tests', function() {

	beforeEach(function(done) {

	});

	afterEach(function(done) {

	});

    it.skip("can bind to cluster threads", function(done) {
        done();
    });

    it.skip("can send log events to master", function(done) {
        done();
    });

    it.skip("can receive log events in master", function(done) {
        done();
    });

});