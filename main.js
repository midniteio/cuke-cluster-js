const cluster = require('cluster');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const cpus = require('os').cpus().length;

const cli = require('./lib/cli');

// Run if invoked from command line with CLI args
if (!module.parent) {
  run(cli).then(function(exitCode) {
    process.exit(exitCode);
  });
}

// Run if invoked from being required by another modules with passed args
module.exports = function(options) {
  return run(options || {});
};

function run(options) {
  return new Promise(function(resolve) {
    _.defaults(options, {
      paths: ['features'],
      tags: [],
      requires: [],
      cucumberPath: require.resolve('cucumber'),
      workers: cpus
    });
    
    process.env.LOG_DIR = path.join(process.cwd(), '.cuke-cluster');
    fs.ensureDir(process.env.LOG_DIR);

    if(cluster.isMaster) {
      resolve(require('./lib/master')(cluster, options));
    } else {
      require('./lib/worker')(cluster, options);
    }
  });
}
