const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const colorMap = require('../../data/cucumber-color-map');
const colorize = require('../../utils/unix').colorize;
const indent = require('../../utils/unix').indent;
const buffer = require('../../utils/unix').buffer;

module.exports = function(filename) {
  var fileData = fs.readFileSync(filename);
  var feature = JSON.parse(fileData).pop();
  var featureFile = path.basename(feature.uri);

  buffer.log('Feature: ' + feature.name);

  var scenario = feature.elements.filter(function(element) {
    return element.type === 'scenario';
  }).pop();

  if (scenario.tags) {
    var tagsArray = _.map(scenario.tags, 'name');
    buffer.log(colorize(indent(1) + tagsArray.join(' '), colorMap.tag));
  }

  buffer.log(indent(1) + 'Scenario: ' + scenario.name);

  var scenarioData = processSteps(scenario, featureFile);
  scenarioData.name = scenario.name;
  scenarioData.feature = feature.name;
  scenarioData.file = featureFile;
  scenarioData.line = scenario.line;
  scenarioData.output = buffer.data;

  return scenarioData;
};

var processSteps = function(scenario, file) {
  var maxStepLength = findMaxStepTitleLength(scenario.steps);
  var passed = true;
  var totalSteps = 0;
  var duration = 0;
  var stepStatuses = {};
  var undefinedSteps = [];


  scenario.steps.forEach(function(step) {
    if (!step.hidden) {
      var lineStr = colorize('#' + file + ':' + step.line, colorMap.comment);
      var stepDesc = colorize(
        indent(2) + _.padEnd(step.keyword + step.name, maxStepLength) + indent(1),
        colorMap[step.result.status]
      );

      buffer.log(stepDesc + lineStr);

      if (step.result.status === 'failed') {
        buffer.log(JSON.stringify(step.result.error_message));
        passed = false;
      }

      if (step.result.status.toLowerCase() === 'undefined') {
        undefinedSteps.push(step.keyword + step.name);
      }

      stepStatuses[step.result.status] = (stepStatuses[step.result.status]) ? ++stepStatuses[step.result.status] : 1;
      duration += step.result.duration;
      totalSteps++;
    }
  });

  return {
    passed: passed,
    totalSteps: totalSteps,
    stepStatuses: stepStatuses,
    undefinedSteps: undefinedSteps,
    duration: duration
  };
};


var findMaxStepTitleLength = function(steps) {
  return steps.map(function(step) {
    return (step.keyword + step.name).length;
  }).sort().pop();
};
