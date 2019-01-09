const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);

describe('helperMethods', () => {
    // let helperMethods;

    beforeEach(() => {
        // helperMethods = proxyquire(`${appRoot}/api/helpers/helperMethods`);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can convert date iso format to timestamp', () => {
        const date = new Date();
        const isoStr = date.toISOString();
        const timestamp = Math.floor(date.getTime() / 1000);

        const result = helperMethods.ISOstringToTimestamp(isoStr);

        chai.expect(result).to.equal(timestamp);
    });

    it('can convert timestamp to isoString', () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const date = new Date(timestamp * 1000);
        const isoStr = date.toISOString();

        const result = helperMethods.timeStampToISOstring(timestamp);

        chai.expect(result).to.equal(isoStr);
    });

    it('can create timestamp', () => {
        const result = helperMethods.createTimeStamp();

        chai.expect(typeof result).to.be.equal('number');
        chai.expect(result.toString().length).to.be.equal(10);
    });
});