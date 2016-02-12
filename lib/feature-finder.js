const path = require('path');
const fs = require('fs-extra');
const Promise = require('bluebird');
const glob = Promise.promisify(require('glob'));
const _ = require('lodash');

const Gherkin = require('gherkin');
const parser = new Gherkin.Parser();

module.exports = function(cucumberOptions) {
  return Promise.map(cucumberOptions.paths, function(featurePath) {
    if (path.parse(featurePath).ext) {
      return Promise.resolve(featurePath);
    } else {
      return glob(path.join(featurePath, '**', '*.feature'));
    }
  })
  .then(function(files) {
    files = _.flattenDeep(files);
    return files.map(function(file) {
      var featureData = parseFeature(file);
      return featureData.scenarioDefinitions
        .filter(function(scenario) {
          var scenarioTags = _.map(scenario.tags, 'name');
          var matchingTags = _.intersection(scenarioTags, cucumberOptions.tags);
          return matchingTags.length === cucumberOptions.tags.length;
        })
        .map(function(scenario) {
          return path.relative(process.cwd(), file) + ':' + scenario.location.line;
        });
    });
  })
  .then(function(results) {
    return _.flattenDeep(results);
  });
};

function parseFeature(path) {
  try {
    var file = fs.readFileSync(path, {encoding: 'utf8'});
    return parser.parse(file);
  } catch (e) {
    console.log(path + ' could not be parsed from Gherkin, ignoring as a feature file.', e);
    return {scenarioDefinitions: []};
  }
}
