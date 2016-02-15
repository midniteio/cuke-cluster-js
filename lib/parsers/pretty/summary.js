const _ = require('lodash');
const prettyMs = require('pretty-ms');

const colorMap = require('../../../data/cucumber-color-map');
const colorize = require('../../../utils/unix').colorize;

module.exports = function(startTime, summaryData) {
  var endDuration = new Date() - startTime;
  var pluralize = (summaryData.totalScenarios === 1) ? 'scenario' : 'scenarios';
  var stepDescription = (summaryData.totalSteps > 0) ? ' steps (' + statusToString(summaryData.stepStatuses) + ')' : ' steps';
  var percentGain = (summaryData.totalDuration === 0 ) ? 'N/A' : Math.round((endDuration/summaryData.totalDuration) * 100) + '%';

  if (summaryData.failedScenarios.length > 0) {
    console.log(colorize('Failed scenarios:', colorMap.failed));
    console.log(colorize(summaryData.failedScenarios.join('\n'), colorMap.failed) + '\n');
  }

  if (summaryData.undefinedSteps.length > 0) {
    console.log(colorize('Undefined steps:', colorMap.undefined));
    console.log(colorize(summaryData.undefinedSteps.join('\n'), colorMap.undefined) + '\n');
  }

  console.log(
    '%s %s (%s)',
    summaryData.totalScenarios,
    pluralize,
    statusToString(summaryData.scenarioStatuses)
  );

  console.log(summaryData.totalSteps + stepDescription);

  console.log(
    'Total duration: %s (%s if ran in series - %s gain)',
    prettyMs(endDuration),
    prettyMs(summaryData.totalDuration/1000000),
    percentGain
  );
};

var statusToString = function(statusObj) {
  var nonZeroStatuses = _.omitBy(statusObj, function(value) {
    return value === 0;
  });
  var output = _.map(nonZeroStatuses, function(value, key) {
    return colorize(value + ' ' + key, colorMap[key]);
  });
  return output.join(', ');
};
