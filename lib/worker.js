const path = require('path');

module.exports = function(cluster, options, parser) {
  var cucumber = require(options.cucumberPath);

  var feature = path.parse(process.env.feature);
  var featureFile = process.env.feature.split(':').shift();
  var featureName = feature.name;
  var scenarioLine = feature.ext.split(':').pop();

  var filename = path.join(process.env.LOG_DIR, featureName + '-line-' + scenarioLine + '.json');
  var relativeFilename = path.relative(process.cwd(), filename);

  var args = ['', '', process.env.feature, '-f', 'json:' + relativeFilename];

  options.requires.forEach(function(req) {
    args.push('-r');
    args.push(req);
  });

  try {
    cucumber.Cli(args).run(function() {
      process.send(parser.scenario(filename));
      cluster.worker.disconnect();
    });
  } catch (e) {
    process.send(parser.exception(featureFile, e));
    cluster.worker.disconnect();
  }
};
