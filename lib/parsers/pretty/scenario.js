const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const colorMap = require('../../../data/cucumber-color-map');
const colorize = require('../../../utils/unix').colorize;
const indent = require('../../../utils/unix').indent;
const buffer = require('../../../utils/unix').buffer;

var testData = require('../../../data/tracking-data');

module.exports = function(filename) {
  var fileData = fs.readFileSync(filename);
  var feature = JSON.parse(fileData).pop();
  var featureFile = path.basename(feature.uri);

  buffer.log('Feature: ' + feature.name);

  var scenario = feature.elements.filter(function(element) {
    return element.type === 'scenario';
  }).pop();

  var tagsArray = _.map(scenario.tags, 'name');
  buffer.log(colorize(indent(1) + tagsArray.join(' '), colorMap.tag));
  buffer.log(indent(1) + 'Scenario: ' + scenario.name);

  processSteps(scenario, featureFile);

  return {
    data: testData,
    output: buffer.dump()
  };
};

var processSteps = function(scenario, file) {
  var maxStepLength = findMaxStepTitleLength(scenario.steps);
  var passed = true;

  scenario.steps.forEach(function(step) {
    if (!step.hidden) {
      var lineStr = colorize('#' + file + ':' + step.line, colorMap.comment);
      var stepDesc = colorize(
        indent(2) + _.padEnd(step.keyword + step.name, maxStepLength) + indent(1),
        colorMap[step.result.status]
      );

      buffer.log(stepDesc + lineStr);

      if (step.result.status === 'failed') {
        buffer.log(colorize('\n' + indent(2) + step.result.error_message +'\n', 'red'));
        passed = false;
      }

      if (step.result.status.toLowerCase() === 'undefined') {
        testData.undefinedSteps.push(step.keyword + step.name);
      }

      testData.stepStatuses[step.result.status]++;
      testData.totalDuration += _.isNumber(step.result.duration) ? step.result.duration : 0;
      testData.totalSteps++;
    }
  });

  if (!passed) {
    testData.failedScenarios.push(file + ':' + scenario.line + ' # ' + scenario.name);
    testData.scenarioStatuses.failed++;
  } else {
    testData.scenarioStatuses.passed++;
  }

  testData.totalScenarios++;
};

var findMaxStepTitleLength = function(steps) {
  return steps.map(function(step) {
    return (step.keyword + step.name).length;
  }).sort().pop();
};
