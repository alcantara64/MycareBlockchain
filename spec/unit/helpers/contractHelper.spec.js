const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const chai = require('chai');
const sinon = require('sinon');
const dotenv = require('dotenv');

dotenv.config();
const expect = chai.expect;
const assert = chai.assert;

let sandbox = sinon.createSandbox();

let contractHelper;

describe('contractHelper', () => {
    let Web3jsStub;
    let contractStub;
    let getAccountsStub;
    let unlockAccountStub;
    let readFileSyncStub;
    let azureKeyVault;
    let getTxCountStub;
    let ethereumjs;
    let tx;
    let sendSignedTransactionStub;

    const baseAddress = '0xE6VFT57677EdB17eE116407236CF904g42342d21bfd1';
    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';
    const txCount = 4;
    const contractAddress = '0x91e02c6d3bbcfd1e4a00c232e0da0a29fe56f114';
    const txStr = 'dgfhcmsoufkfrfkfrni47fbn47rf8438';

    const networkId = process.env.NETWORK_ID;

    let jsonObj = {
        networks: {},
        abi: [{
            constant: true,
            inputs: [{
                name: '',
                type: 'uint256'
            }]
        }]
    };

    beforeEach(() => {
        jsonObj.networks[process.env.NETWORK_ID] = { address: contractAddress };
        azureKeyVault = {};
        tx = {
            sign: sandbox.stub(),
            serialize: sandbox.stub().returns(txStr)
        };

        sendSignedTransactionStub = sandbox.spy();

        ethereumjs = function EthreumjsConstructor(rawTx) {
            Object.assign(ethereumjs, {
                instance: sandbox.stub()
            });

            ethereumjs.instance(rawTx);

            return tx;
        };

        getTxCountStub = sandbox.stub().returns(txCount);

        readFileSyncStub = sandbox.stub();
        readFileSyncStub.returns(JSON.stringify(jsonObj));

        contractStub = sandbox.stub();
        contractStub.returns({
            _address: contractAddress,
            methods: {
                testMethod: () => {}
            }
        });

        getAccountsStub = sandbox.stub();

        getAccountsStub.returns([baseAddress]);
        unlockAccountStub = sandbox.stub();

        function Web3js() {
            this.eth = {
                Contract: contractStub,
                getAccounts: getAccountsStub,
                account: [baseAddress],
                getTransactionCount: getTxCountStub,
                sendSignedTransaction: sendSignedTransactionStub
            };

            this.personal = {
                unlockAccount: unlockAccountStub
            };
        }

        const imports = {
            web3: Web3js,
            fs: {
                readFileSync: readFileSyncStub
            }
        };
        imports[`${appRoot}/api/middlewares/authentication/azureKeyVault`] = azureKeyVault;
        imports['ethereumjs-tx'] = ethereumjs;

        contractHelper = proxyquire(`${appRoot}/api/helpers/contractHelper`, imports);
    });

    afterEach(() => {
        // restore all stubs created through the sandbox
        sandbox.restore();
    });

    it('can get and iniialize transaction credentials', async () => {
        const accountAddress = '0x474ee25b7c86a818ec75f6a48112bd278589e5d3';
        const accountAddressJSON = `{"value": "${accountAddress}"}`;
        const privateKey = '83332de5fd5b26f04ca526713cbf27330f9c38addabf18cddaa75292ec07692c';
        const privateKeyJSON = `{"value": "${privateKey}"}`;

        const gasLimit = 12094567;

        const rawTx = {
            nonce: txCount,
            gasPrice: '0x00',
            gasLimit,
            to: contractAddress,
            value: '0x00',
            data
        };

        const contractName = 'MyCare';
        const compiledFilePath = `${appRoot}/build/contracts/${contractName}.json`;

        azureKeyVault.getSecret = sandbox.stub();

        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_PRIVATE_KEY).resolves(privateKeyJSON);
        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_ADDRESS).resolves(accountAddressJSON);

        const ContractHelper = new contractHelper.ContractHelper(contractName);

        await ContractHelper.sendTransaction(data, gasLimit);

        sandbox.assert.calledWith(getTxCountStub, accountAddress);
        sandbox.assert.calledWith(readFileSyncStub, compiledFilePath);
        sandbox.assert.calledWith(contractStub, jsonObj.abi, contractAddress, {});

        sandbox.assert.calledWith(ethereumjs.instance, rawTx);
        const privateKeyBuff = Buffer.from(JSON.parse(privateKeyJSON).value, 'hex');
        sandbox.assert.calledWith(tx.sign, privateKeyBuff);

        const raw = `0x${txStr.toString('hex')}`;
        sandbox.assert.calledWith(sendSignedTransactionStub, raw);

        sandbox.assert.calledWith(azureKeyVault.getSecret, process.env.ACCOUNT_ADDRESS);
        sandbox.assert.calledWith(azureKeyVault.getSecret, process.env.ACCOUNT_ADDRESS);
    });
});