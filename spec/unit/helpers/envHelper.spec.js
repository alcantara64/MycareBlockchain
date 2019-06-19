const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const sandbox = sinon.createSandbox();
const { assert } = sandbox;

describe('envHelper', () => {
  let envHelper;
  beforeEach(() => {
    const imports = {};

    envHelper = proxyquire(`${appRoot}/api/helpers/envHelper`, imports);
  });

  it('works correctly', () => {
    //
  });

  afterEach(() => {
    sandbox.restore();
  });
});
