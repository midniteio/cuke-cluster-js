const path = require('path');
const format = require('./parsers');

module.exports = function(cluster, options) {
  var cucumber = require(options.cucumberPath);
  var feature = path.parse(process.env.feature);
  var featureFile = process.env.feature.split(':').shift();
  var featureName = feature.name;
  var scenarioLine = feature.ext.split(':').pop();
  var filename = path.relative(process.env.LOG_DIR, featureName + '-line-' + scenarioLine + '.json', process.cwd());
  var args = ['', '', process.env.feature, '-f', 'json:' + filename];

  options.requires.forEach(function(req) {
    args.push('-r');
    args.push(req);
  });

  try {
    cucumber.Cli(args).run(function() {
      process.send(format.pretty(filename));
      cluster.worker.disconnect();
    });
  } catch (e) {
    process.send(format.exception(featureFile, e));
    cluster.worker.disconnect();
  }
};
