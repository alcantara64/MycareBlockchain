const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const dotenv = require('dotenv');

dotenv.config();

let sandbox = sinon.createSandbox();

let contractHelper;

describe('contractHelper', () => {
    let contractStub;
    let getAccountsStub;
    let unlockAccountStub;
    let readFileSyncStub;
    let getTxCountStub;
    let azureStorageHelper;
    let ethereumjs;
    let tx;
    let sendSignedTransactionStub;
    let events;
    let addListener;
    let emit;
    let axios;
    let helperMethods;
    let envHelper;

    const env = {
        RPC_ENDPOINT: 'http://localhost:345678',
        ACCOUNT_ADDRESS: '0xc0e0edfcaeacb373efa72c2bfe28',
        NETWORK_ID: '10938372',
        ACCOUNT_PRIVATE_KEY: '9e383eb2a7ee7afddd73ffc38e28b8a73e3733b27bf282c3eacefaae'
    };

    const baseAddress = '0xE6VFT57677EdB17eE116407236CF904g42342d21bfd1';
    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';
    const txCount = 4;
    const contractAddress = '0x91e02c6d3bbcfd1e4a00c232e0da0a29fe56f114';
    const txStr = 'dgfhcmsoufkfrfkfrni47fbn47rf8438';

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
        axios = sandbox.stub();
        addListener = sandbox.spy();
        emit = sandbox.spy();

        envHelper = {
            getConstants() {
                return { ...env };
            }
        };

        function EventEmitterConstructor() {
            this.addListener = addListener;
            this.emit = emit;
        };
        events = {
            EventEmitter: EventEmitterConstructor
        };

        azureStorageHelper = {
            '@noCallThru': true,
            getQueueLength: sandbox.stub()
        };

        helperMethods = {
            requireAsync: sandbox.stub().yields(azureStorageHelper)
        };

        jsonObj.networks[env.NETWORK_ID] = {
            address: contractAddress
        };

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
            events,
            fs: {
                readFileSync: readFileSyncStub
            },
            axios,
            [`${appRoot}/api/helpers/envHelper`]: envHelper
        };
        imports['ethereumjs-tx'] = ethereumjs;
        imports[`${appRoot}/api/helpers/azureStorageHelper`] = azureStorageHelper;
        imports[`${appRoot}/api/helpers/helperMethods`] = helperMethods;

        contractHelper = proxyquire(`${appRoot}/api/helpers/contractHelper`, imports);
    });

    afterEach(() => {
        // restore all stubs created through the sandbox
        sandbox.restore();
    });

    it('can initalize contract instance', async () => {
        const gasLimit = 12094567;

        const contractName = 'MyCare';
        const compiledFilePath = `${appRoot}/build/contracts/${contractName}.json`;

        azureStorageHelper.createMessage = sandbox.stub().resolves(true);

        const ContractHelper = new contractHelper.ContractHelper(contractName);

        const result = await ContractHelper.sendTransaction(data, gasLimit);

        const messageText = JSON.stringify({
            data,
            gasLimit,
            contractAddress
        });

        sandbox.assert.calledWith(azureStorageHelper.createMessage, messageText);
        sandbox.assert.match(result, messageText);
        sandbox.assert.calledWith(emit, contractHelper.TX_EVENTS.ADDED_TX_TO_QUEUE);

        sandbox.assert.calledWith(readFileSyncStub, compiledFilePath);
        sandbox.assert.calledWith(contractStub, jsonObj.abi, contractAddress, {});
    });

    it('adds needed listeners on initialization', () => {
        sandbox.assert.calledWith(addListener, contractHelper.TX_EVENTS.ADDED_TX_TO_QUEUE);
        sandbox.assert.calledWith(addListener, contractHelper.TX_EVENTS.TX_PROCESSING_COMPLETED);
    });

    it('can send signed transaction', async () => {
        const nonce = 907;
        const response = {
            data: {
                result: `0x${nonce.toString(16)}`
            }
        };
        axios.resolves(response);

        const gasLimit = 25282;

        const rawTx = {
            nonce,
            gasPrice: '0x00',
            gasLimit,
            to: contractAddress,
            value: '0x00',
            data
        };

        await contractHelper.sendSignedTransaction(data, gasLimit, contractAddress);

        sandbox.assert.calledWith(axios, {
            method: 'post',
            url: env.RPC_ENDPOINT,
            headers: {
                'Content-Type': 'application/json'
            },
            data: {
                method: 'parity_nextNonce',
                params: [env.ACCOUNT_ADDRESS],
                id: 1,
                jsonrpc: '2.0'
            }
        });

        const privateKeyBuff = Buffer.from(env.ACCOUNT_PRIVATE_KEY, 'hex');

        const raw = `0x${txStr.toString('hex')}`;
        sandbox.assert.calledWith(sendSignedTransactionStub, raw);
        sandbox.assert.calledWith(ethereumjs.instance, rawTx);
        sandbox.assert.calledWith(tx.sign, privateKeyBuff);
    });

    describe('checkIfTxInQueue', () => {
        it('emits event ADDED_TX_TO_QUEUE if there are transactions in queue', async () => {
            azureStorageHelper.queueHasNewMessages = sandbox.stub().resolves(true);
            await contractHelper.checkIfTxInQueue();

            sandbox.assert.called(azureStorageHelper.queueHasNewMessages);
            sandbox.assert.calledWith(emit, contractHelper.TX_EVENTS.ADDED_TX_TO_QUEUE);
        });

        it('does not emit event when there is no transaction in queue', async () => {
            azureStorageHelper.queueHasNewMessages = sandbox.stub().resolves(false);
            await contractHelper.checkIfTxInQueue();

            sandbox.assert.called(azureStorageHelper.queueHasNewMessages);
            sandbox.assert.neverCalledWith(emit, contractHelper.TX_EVENTS.ADDED_TX_TO_QUEUE);
        });
    });

    describe('handleNewTxInQueue', () => {
        it('sends signed transactions and deletes processed message', async () => {
            const gasLimit = 11235600;
            const txObj = {
                data,
                gasLimit,
                contractAddress
            };
            const messages = [
                {
                    messageId: 'cf9b8ff8-8072-43d8-bcfe-5efc0e007e60',
                    insertionTime: 'Wed, 03 Apr 2019 18:04:20 GMT',
                    expirationTime: 'Wed, 10 Apr 2019 18:04:20 GMT',
                    popReceipt: 'AgAAAAMAAAAAAAAAcsh0/Ujq1AE=',
                    timeNextVisible: 'Wed, 03 Apr 2019 18:13:51 GMT',
                    dequeueCount: 2,
                    messageText: JSON.stringify(txObj)
                }
            ];

            contractHelper.sendSignedTransaction = sandbox.stub().resolves(true);

            azureStorageHelper.deleteMessage = sandbox.stub().resolves(true);

            azureStorageHelper.getMessages = sandbox.stub().resolves(messages);
            await contractHelper.handleNewTxInQueue();

            sandbox.assert.called(azureStorageHelper.getMessages);
            sandbox.assert.calledWith(contractHelper.sendSignedTransaction, data, gasLimit, contractAddress);
            sandbox.assert.calledWith(azureStorageHelper.deleteMessage, messages[0]);

            sandbox.assert.calledWith(emit, contractHelper.TX_EVENTS.TX_PROCESSING_COMPLETED);
        });

        it('does not delete message from queue if sendSignedTransactionn fails', async () => {
            const gasLimit = 11235600;
            const txObj = {
                data,
                gasLimit,
                contractAddress
            };
            const messages = [
                {
                    messageId: 'cf9b8ff8-8072-43d8-bcfe-5efc0e007e60',
                    insertionTime: 'Wed, 03 Apr 2019 18:04:20 GMT',
                    expirationTime: 'Wed, 10 Apr 2019 18:04:20 GMT',
                    popReceipt: 'AgAAAAMAAAAAAAAAcsh0/Ujq1AE=',
                    timeNextVisible: 'Wed, 03 Apr 2019 18:13:51 GMT',
                    dequeueCount: 2,
                    messageText: JSON.stringify(txObj)
                }
            ];

            contractHelper.sendSignedTransaction = sandbox.stub().rejects(new Error('Transaction out of gas'));

            azureStorageHelper.deleteMessage = sandbox.stub().resolves(true);

            azureStorageHelper.getMessages = sandbox.stub().resolves(messages);
            await contractHelper.handleNewTxInQueue();

            sandbox.assert.called(azureStorageHelper.getMessages);
            sandbox.assert.calledWith(contractHelper.sendSignedTransaction, data, gasLimit, contractAddress);
            sandbox.assert.notCalled(azureStorageHelper.deleteMessage);
            sandbox.assert.calledWith(emit, contractHelper.TX_EVENTS.TX_PROCESSING_COMPLETED);
        });
    });
});