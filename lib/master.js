const Promise = require('bluebird');
const _ = require('lodash');
const cpus = require('os').cpus().length;

const featureFinder = require('./feature-finder');
const startTime = new Date();

var summaryData = {}, overallExitCode = 0;

module.exports = function(cluster, options, parser) {
  return new Promise(function(resolve, reject) {
   cluster.setupMaster({ silent: true });

    featureFinder(options).then(function(features) {
      for(var i = 0; i < Math.min(cpus, options.workers); i++) {
        if(features.length > 0) {
          var worker_env = {feature: features.pop()};
          var worker = cluster.fork(worker_env);
          worker.on('message', handleMessage);
        }
      }

      cluster.on('exit', function(code) {
        if (features.length > 0) {
          var worker_env = {feature: features.pop()};
          cluster.fork(worker_env);
        }
        if (code !== 0) {
          overallExitCode = 1;
        }
        if (_.isEmpty(cluster.workers)) {
          parser.summary(startTime, summaryData);
          resolve(overallExitCode);
        }
      });

      cluster.on('error', function(worker, error) {
        console.log('Error caught: ', error);
        reject(error);
      });
    });
  });
};

var handleMessage = function(payload) {
  summaryData = _.mergeWith(summaryData, payload.data, function(objValue, srcValue) {
    if (_.isNumber(objValue)) {
      return objValue + srcValue;
    }
  });
  console.log(payload.output);
};
