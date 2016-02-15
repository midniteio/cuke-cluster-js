var path = require('path');
var chai = require('chai');

chai.should();

var parser = require('../lib/parsers').pretty;

var featureFile = path.join(__dirname, 'features', 'sample.feature');
var featureOutput = path.join(__dirname, 'fixtures', 'sample-feature-output.json');
var err = new Error('Test error');

describe('Pretty parser', function() {
  it('scenario() should return a properly constructed object', function() {
    return Promise.all([
      parser.scenario(featureOutput).should.have.deep.property('data.totalSteps'),
      parser.scenario(featureOutput).should.have.deep.property('data.totalScenarios'),
      parser.scenario(featureOutput).should.have.deep.property('data.failedScenarios'),
      parser.scenario(featureOutput).should.have.deep.property('data.stepStatuses'),
      parser.scenario(featureOutput).should.have.deep.property('data.scenarioStatuses'),
      parser.scenario(featureOutput).should.have.deep.property('data.undefinedSteps'),
      parser.scenario(featureOutput).should.have.deep.property('data.totalDuration')
    ]);
  });

  it('scenario() should return an object with output data', function () {
    return parser.scenario(featureOutput).should.have.property('output').and.to.not.be.undefined;
  });

  it('exception() should return an object with output data', function () {
    return parser.exception(featureFile, err).should.have.property('output').and.to.not.be.undefined;
  });

  it('exception() should return data with scenario listed as failure', function() {
    return parser.exception(featureFile, err).should.have.deep.property('data.failedScenarios').and.to.not.be.undefined;
  });
});
