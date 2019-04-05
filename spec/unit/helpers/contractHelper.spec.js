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
    let azureKeyVault;
    let getTxCountStub;
    let azureStorageHelper;
    let ethereumjs;
    let tx;
    let sendSignedTransactionStub;
    let events;
    let addListener;
    let emit;
    let axios;

    const baseAddress = '0xE6VFT57677EdB17eE116407236CF904g42342d21bfd1';
    const data = '0x300000000000000ddeeecc300099aa9cccc9ff9eedacf83035ad93e939f99c929a939e939a99b9';
    const txCount = 4;
    const contractAddress = '0x91e02c6d3bbcfd1e4a00c232e0da0a29fe56f114';
    const txStr = 'dgfhcmsoufkfrfkfrni47fbn47rf8438';
    const accountAddress = '0x474ee25b7c86a818ec75f6a48112bd278589e5d3';
    const accountAddressJSON = {
        value: accountAddress
    };
    const privateKey = '83332de5fd5b26f04ca526713cbf27330f9c38addabf18cddaa75292ec07692c';
    const privateKeyJSON = {
        value: privateKey
    };

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
        function EventEmitterConstructor() {
            this.addListener = addListener;
            this.emit = emit;
        };
        events = {
            EventEmitter: EventEmitterConstructor
        };

        azureStorageHelper = {};
        jsonObj.networks[process.env.NETWORK_ID] = {
            address: contractAddress
        };
        azureKeyVault = {
            getSecret: sandbox.stub()
        };

        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_PRIVATE_KEY).resolves(privateKeyJSON);
        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_ADDRESS).resolves(accountAddressJSON);
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
            axios
        };
        imports[`${appRoot}/api/middlewares/authentication/azureKeyVault`] = azureKeyVault;
        imports['ethereumjs-tx'] = ethereumjs;
        imports[`${appRoot}/api/helpers/azureStorageHelper`] = azureStorageHelper;

        contractHelper = proxyquire(`${appRoot}/api/helpers/contractHelper`, imports);
    });

    afterEach(() => {
        // restore all stubs created through the sandbox
        sandbox.restore();
    });

    it('can initalize contract instance', async () => {
        const accountAddress = '0x474ee25b7c86a818ec75f6a48112bd278589e5d3';
        const accountAddressJSON = {
            value: accountAddress
        };
        const privateKey = '83332de5fd5b26f04ca526713cbf27330f9c38addabf18cddaa75292ec07692c';
        const privateKeyJSON = {
            value: privateKey
        };

        const gasLimit = 12094567;

        const contractName = 'MyCare';
        const compiledFilePath = `${appRoot}/build/contracts/${contractName}.json`;

        azureKeyVault.getSecret = sandbox.stub();

        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_PRIVATE_KEY).resolves(privateKeyJSON);
        azureKeyVault.getSecret.withArgs(process.env.ACCOUNT_ADDRESS).resolves(accountAddressJSON);

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
        sandbox.assert.calledWith(addListener, contractHelper.TX_EVENTS.INITIALIZED_TX_CREDENTIALS);
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

        // this call ensures private key and public key are loaded
        await contractHelper.initializeTransactionCredentials();

        await contractHelper.sendSignedTransaction(data, gasLimit, contractAddress);

        sandbox.assert.calledWith(axios, {
            method: 'post',
            url: process.env.RPC_ENDPOINT,
            data: {
                method: 'parity_nextNonce',
                params: [accountAddress],
                id: 1,
                jsonrpc: '2.0'
            }
        });

        const privateKeyBuff = Buffer.from(privateKeyJSON.value, 'hex');

        const raw = `0x${txStr.toString('hex')}`;
        sandbox.assert.calledWith(sendSignedTransactionStub, raw);
        sandbox.assert.calledWith(ethereumjs.instance, rawTx);
        sandbox.assert.calledWith(tx.sign, privateKeyBuff);
    });

    describe('checkIfTxInQueue', () => {
        it('emits event ADDED_TX_TO_QUEUE if there are transactions in queue', async () => {
            azureStorageHelper.getQueueLength = sandbox.stub().resolves(2);   
            await contractHelper.checkIfTxInQueue();

            sandbox.assert.called(azureStorageHelper.getQueueLength);
            sandbox.assert.calledWith(emit, contractHelper.TX_EVENTS.ADDED_TX_TO_QUEUE);
        });

        it('does not emit event when there is no transaction in queue', async () => {
            azureStorageHelper.getQueueLength = sandbox.stub().resolves(0);
            await contractHelper.checkIfTxInQueue();

            sandbox.assert.called(azureStorageHelper.getQueueLength);
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