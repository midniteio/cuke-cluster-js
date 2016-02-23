# cuke-cluster-js


## cuke-cluster-js is no longer supported for development. ##
### Please see https://github.com/midniteio/multi-cuke for future development ###

An inherit issue with using cluster as your worker/process coordinator occurs if your tests require spawning a server that listens to port 0 for dynamic port allocation. The cluster api has specific handling around this and some other IO communication channels that make it not ideal for generic handling of processes. As it's built on top child_process.fork(), it's safer and more flexible to reimplement this parallelization utilizing that. https://github.com/midniteio/multi-cuke is built on that principle, using this repository as a springboard, and it's advised to use that module in place of cuke-cluster-js now.



#### Archived for reference ####

`cuke-cluster-js` is an implementation for parallelized Cucumber-js testing using Node's Cluster API.

It utilizes the Gherkin JS module as a parser to determine the entire set of scenarios that fit the passed arguments and spins up workers to run each- up to the number of available OS processor, or alternatively the passed number of workers (lesser of the two). As a test worker ends, a new worker is spun up to handle the next scenario on the stack, until empty.

### Using cuke-cluster-js from another Node module
cuke-cluster-js is easily called from within your NodeJS source like any other NPM module:
```javascript
const cukeCluster = require('cuke-cluster-js');
cukeCluster();
```
cuke-cluster-js is Promise-based, and resolves a promise containing the exit code when all have finished running. Running from the command line will auto-exit with the returned exit code, while calling cuke-cluster-js from a node module returns the promise that resolves to an exit code to be handled at your discretion. The promise is **not** rejected due to test scenario failures, but **is** rejected on errors in test execution to differentiate and provide clarity.


cuke-cluster-js takes an options object as a parameter, but when none is passed will default to standard options, which are:
```javascript
{
  paths: ['features'],
  tags: [],
  requires: [],
  cucumberPath: require.resolve('cucumber'),
  workers: require('os').cpus().length
}
```
The options object passed is extended with default values via lodash's `_.default()` utility, so passing all options are not required, and passing simply
```javscript
{ paths: ['otherFeatureDir'] }
```
or
```javascript
{
  tags: ['@Smoke'],
  workers: 4
}
```
is as valid as passing all options.

### Using cuke-cluster-js from command line
cuke-cluster-js comes ready to use from command line. It supports arguments of both feature paths and directory paths that contain features (including multiple paths), as well as the following tags:
```

  -t, --tag       Scenario tag, as defined by cucumber-js
  -r, --require   Require flag, to specify non-default files to require, as defined by cucumber-js
  -c, --cucumber  Specify using a specific cucumber installation
  -w, --workers   Number of workers in parallel at a given time (defaults to the number of processors if none passed).

```
All of the above options can also be found by using the `--help` flag on the command line.

Examples valid command from the command line (assuming cuke-cluster-js is globally installed with `npm install -g cuke-cluster-js`):

With default options, being run inside a directory with a `features` directory containing feature files.
```
cuke-cluster-js
```

Specifying a specific path to feature files, and using only the `@Smoke` tag
```
cuke-cluster-js path/to/features -t @Smoke
```

(Multiple) specific individual feature files
```
cuke-cluster-js some-features/test1.feature other-feature/test2.feature
```

It does not support the formatter flag currently available in cucumber-js' CLI, as parsing of the output of multiple concurrent jobs acts differently than a single thread. See below for more information.

It is important to note that cuke-cluster-js defers to the installed version of cucumber-js unless otherwise passed a path to another cucumber install. To use a specific/pinned version of cucumber in your project, simply pass it on the command line or include it in the options object, and that will be used in place of the local dependency installed with cuke-cluster-js.


### Differences from standard Cucumber-js
To best consolidate the data of all scenario runs into meaningful test results, cuke-cluster-js runs Cucumber with the json formatter, and the results parsed back to pretty formatting for readability by `lib/parsers/pretty`. The standard cucumber-js formatters would have formatting and/or redundancy issues, so are not supported (at this time) and ignored here. Additional parsers can be added using the same API as defined in `lib/parsers/pretty`.

cuke-cluster-js also explicitly silences the stdio channels of the workers. Errors are still caught and surfaced in the worker's execution, but this prevents the test/step definitions from throwing errors to stdout in real-time as other tests run in parallel (and potentially creating very unclear logs). Additional/debug logging past error handling can alternatively be handled by having a debug log piped to file from step definitions, which serves a better purpose than writing to stdout and would not be affected by cuke-cluster-js.

Additionally, since errors are caught and handled per-scenario basis, exceptions that would otherwise exit the process of Cucumber-js when found in a given scenario will be contained to that scenario's process, output, and logged- but will not stop the execution of other tests unrelated to that issue.

Contributions welcome.
