const prettyMs = require('pretty-ms');
const Promise = require('bluebird');
const _ = require('lodash');

const featureFinder = require('./feature-finder');
const colorMap = require('../data/cucumber-color-map');
const colorize = require('../utils/unix').colorize;

const cpus = require('os').cpus().length;

var totalSteps = 0;
var totalScenarios = 0;
var totalDuration = 0;
var undefinedSteps = [];
var failedScenarios = [];
var scenarioStatuses = {};
var stepStatuses = {};
var overallExitCode = 0;

module.exports = function(cluster, options) {
  return new Promise(function(resolve, reject) {
    var startTime = new Date();
    //cluster.setupMaster({ silent: true });

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
          handleSummary(startTime);
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
  _.forIn(payload.stepStatuses, function(value, key) {
    stepStatuses[key] = stepStatuses[key] ? stepStatuses[key] += value : value;
  });

  if (!payload.passed) {
    failedScenarios.push(payload.file + ':' + payload.line + ' # ' + payload.name);
  }

  var status = (payload.passed) ? 'passed' : 'failed';
  scenarioStatuses[status] = scenarioStatuses[status] ? ++scenarioStatuses[status] : 1;

  undefinedSteps.concat(payload.undefinedSteps);
  totalSteps += payload.totalSteps;
  totalDuration += payload.duration;
  totalScenarios++;

  console.log(payload.output);
};

var handleSummary = function(startTime) {
  var pluralize = (totalScenarios === 1) ? 'scenario' : 'scenarios';
  var stepDescription = (totalSteps > 0) ? ' steps (' + statusToString(stepStatuses) + ')' : ' steps';
  var percentGain = (totalDuration === 0) ? 'N/A' : Math.round((endTime/totalDuration) * 100) + '%';
  var endTime = new Date() - startTime;

  if (failedScenarios.length > 0) {
    console.log(colorize('Failed scenarios:', colorMap.failed));
    console.log(colorize(failedScenarios.join('\n'), colorMap.failed), '\n');
  }
  if (undefinedSteps.length > 0) {
    console.log(colorize('Undefined steps:', colorMap.undefined));
    console.log(colorize(undefinedSteps.join('\n'), colorMap.undefined), '\n');
  }
  console.log('%s %s (%s)', totalScenarios, pluralize, statusToString(scenarioStatuses));
  console.log(totalSteps + stepDescription);

  console.log(
    'Total duration: %s (%s if ran in series - %s gain)',
    prettyMs(endTime),
    prettyMs(totalDuration),
    percentGain
  );
};

var statusToString = function(statusObj) {
  var output = _.map(statusObj, function(value, key) {
    return colorize(value + ' ' + key, colorMap[key]);
  });
  return output.join(', ');
};
