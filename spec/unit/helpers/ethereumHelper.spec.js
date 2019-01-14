const appRoot = require('app-root-path');
const proxyquire = require('proxyquire'),
    chai = require('chai'),
    sinon = require('sinon')

let sandbox = sinon.createSandbox();

describe('ethereumHelper', () => {
    let web3js;
    let ethereumHelper;
    let cryptoStub;
    let randomBytesStub;
    let httpProviderStub;
    let privateKeyTextStub;
    let toStringStub;
    const randombytes = 'random_bytes';

    let jsonObj = {
        abi: [],
        networks: {}
    }

    beforeEach(() => {
        httpProviderStub = sandbox.stub();
        privateKeyTextStub = sandbox.stub();
        toStringStub = sandbox.stub().returns(randombytes);
        randomBytesStub = sandbox.stub().returns({
            toString: toStringStub
        });

        cryptoStub = {
            randomBytes: randomBytesStub
        }


        web3js = function web3js() {
            this.eth = {
                accounts: {
                    privateKeyToAccount: privateKeyTextStub
                }
            }

            this.currentProvider = {};
            web3js.providers = {
                HttpProvider: httpProviderStub
            }
        }

        ethereumHelper = proxyquire(`${appRoot}/api/helpers/ethereumHelper`, {
            'web3': web3js,
            'crypto': cryptoStub
        })
    });

    afterEach(() => {
        // restore all stubs created through the sandbox
        sandbox.restore();
    });

    it('can get account', () => {

        let privatekeyText = 'private_key_text';
        ethereumHelper.getAccount(privatekeyText);
        sandbox.assert.calledWith(privateKeyTextStub, privatekeyText);
    });

    it('can generate random ethereum key', () => {
        let result = ethereumHelper.generateRandomEthereumKey();

        sandbox.assert.calledWith(toStringStub, 'hex');
        sandbox.assert.calledWith(randomBytesStub, 32);
        chai.expect(result).to.eql(`0x${randombytes}`)
    });
});