const appRoot = require('app-root-path');
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);
const dotenv = require('dotenv');
dotenv.config();

const sinon = require('sinon');
let sandbox = sinon.createSandbox();

describe('mycareController', () => {
    let mycareController;
    let mycareService;
    let res;
    let resJSON;
    let keyHelper;
    let contractHelper;

    const transactionReceipt = {
        status: true,
        hash: '0x807c81e8a72b8e897dd820d2e482e3dcea744f316bb4f0ccd612da275241c28b00000000000029993999'
    };

    const walletAddress = '0x23ff33sd8ace82c72f82c28e82addecf23795fc';
    const timestamp = '2018-11-21T11:26:34.142Z';
    const profileHash = '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d';

    beforeEach(() => {
        mycareService = {};
        contractHelper = {};
        keyHelper = {};

        resJSON = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJSON
            })
        };

        const imports = {
            [`${appRoot}/api/helpers/keyHelper`]: keyHelper,
        };

        imports[`${appRoot}/api/services/mycareService`] = mycareService;
        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;

        mycareController = proxyquire(`${appRoot}/api/controllers/mycareController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add account', async () => {
        mycareService.AddAccount = sandbox.stub().resolves(transactionReceipt);
        mycareService.AccountTypeExists = sandbox.stub().resolves(true);

        const req = {
            user: {
                _id: 'dhddkdkdkdddkddldldldl'
            },
            body: {
                walletAddress,
                profileHash: '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d',
                timestamp,
                accountType: 'Patient'
            }
        };

        await mycareController.addAccount(req, res);

        sandbox.assert.calledWith(mycareService.AddAccount, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
        sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
    });

    it('does not add account if accountType is invalid', async () => {
        mycareService.AddAccount = sandbox.stub().resolves(transactionReceipt);
        mycareService.AccountTypeExists = sandbox.stub().resolves(false);

        const req = {
            user: {
                _id: 'dhddkdkdkdddkddldldldl'
            },
            body: {
                walletAddress,
                profileHash: '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d',
                timestamp,
                accountType: 'Avenger'
            }
        };

        await mycareController.addAccount(req, res);

        sandbox.assert.notCalled(mycareService.AddAccount);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'invalid account type'
        });
        sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
        sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
    });

    it('add account sends status of 500 when theres a server error', async () => {
        mycareService.AddAccount = sandbox.stub().rejects('Unexpected error occured');
        mycareService.AccountTypeExists = sandbox.stub().resolves(true);

        const req = {
            user: {
                _id: 'dhddkdkdkdddkddldldldl'
            },
            body: {
                walletAddress,
                profileHash,
                timestamp,
                accountType: 'Patient'
            }
        };

        await mycareController.addAccount(req, res);

        sandbox.assert.calledWith(mycareService.AddAccount, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
        sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
    });

    it('can deactivate account successfully', async () => {
        mycareService.DeactivateAccount = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        await mycareController.deactivateAccount(req, res);

        sandbox.assert.calledWith(mycareService.DeactivateAccount, req.body.walletAddress, req.body.timestamp);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('deactivate account returns status 500 error when occurs', async () => {
        mycareService.DeactivateAccount = sandbox.stub().rejects('Unexpected error occured');

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        await mycareController.deactivateAccount(req, res);

        sandbox.assert.calledWith(mycareService.DeactivateAccount, req.body.walletAddress, req.body.timestamp);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('get account returns server error when profileHash and walletAddress isnt found', async () => {
        const req = {
            query: {}
        };

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Invalid query parameters, one of walletAddress and profileHash is required'
        });
    });

    it('returns 404 if account is not found for walletAddress', async () => {
        const req = {
            query: {
                walletAddress
            }
        };

        mycareService.GetAccount = sandbox.stub().resolves(null);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Account not found'
        });
        sandbox.assert.calledWith(mycareService.GetAccount, walletAddress, true);
    });

    it('returns 404 if account is not found for profileHash', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        mycareService.GetAccount = sandbox.stub().resolves(null);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Account not found'
        });
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('returns status of 200 when account is found', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        const account = {
            isEntity: true
        };

        mycareService.GetAccount = sandbox.stub().resolves(account);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, account);
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('get account returns status of 500 when error occurs', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        const account = {
            isEntity: true
        };

        mycareService.GetAccount = sandbox.stub().rejects('Unexpected erorr occured');

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('can get account count', async () => {
        const count = 300;
        mycareService.GetAccountCount = sandbox.stub().resolves(count);

        const req = {};

        await mycareController.getAccountsCount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, {
            count
        });
    });

    it('get account count returns satus of 500 when error occurs', async () => {
        mycareService.GetAccountCount = sandbox.stub().rejects('Unexpected error occured');

        const req = {};

        await mycareController.getAccountsCount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can validate paramters when deactivating account', () => {
        mycareController.validateAccountParams = sandbox.stub();

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        const next = () => { };
        const expectedParams = ['walletAddress', 'timestamp'];

        mycareController.validateDeactivateAccountParams(req, res, next);

        sandbox.assert.calledWith(mycareController.validateAccountParams, req, res, next, expectedParams);
    });

    it('can validate paramters when adding new account', () => {
        mycareController.validateAccountParams = sandbox.stub();

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        const next = () => { };
        const expectedParams = ['walletAddress', 'profileHash', 'timestamp', 'accountType'];

        mycareController.validateAddAccountParams(req, res, next);

        sandbox.assert.calledWith(mycareController.validateAccountParams, req, res, next, expectedParams);
    });

    describe('addAccountType', () => {
        it('returns status 400 if account type is missing', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(true);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.notCalled(mycareService.AddAccountType);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'accountType is required'
            });
        });

        it('returns status 400 if account type is not a valid string', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(true);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 2345677803939
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.notCalled(mycareService.AddAccountType);
            sandbox.assert.notCalled(mycareService.AccountTypeExists);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'accountType must be a valid string'
            });
        });

        it('returns status 400 if account type length is less than 3', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(true);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 'TK'
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.notCalled(mycareService.AddAccountType);
            sandbox.assert.notCalled(mycareService.AccountTypeExists);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'accountType must be string with length greater than 2 and less than or equal to 16'
            });
        });

        it('returns status 400 if account type length is greater than 16', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(true);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 'AreallyLongAccountTypeName'
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.notCalled(mycareService.AddAccountType);
            sandbox.assert.notCalled(mycareService.AccountTypeExists);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'accountType must be string with length greater than 2 and less than or equal to 16'
            });
        });

        it('returns status 409 if account type already exists', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(true);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 'Patient'
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.notCalled(mycareService.AddAccountType);
            sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.CONFLICT.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'accountType already exists'
            });
        });

        it('can save account type successfully', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().resolves(false);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 'Patient'
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.calledWith(mycareService.AddAccountType, req.body.accountType);
            sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
            sandbox.assert.calledWith(resJSON, transactionReceipt);
        });

        it('returns status code 500 if unexpected error occurs', async () => {
            mycareService.AddAccountType = sandbox.stub().resolves(transactionReceipt);
            mycareService.AccountTypeExists = sandbox.stub().rejects(false);

            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    accountType: 'Patient'
                }
            };

            await mycareController.addAccountType(req, res);

            sandbox.assert.calledWith(mycareService.AccountTypeExists, req.body.accountType);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
            });
        });
    });

    describe('generateChainAccount', () => {
        it('can generate chain account', () => {
            const req = {
                user: {
                    _id: 'djdjddddndmcdjddjddhdbdddh'
                }
            };
            const accountDetails = {
                rsaPublicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0vl\nOwIDAQAB\n-----END PUBLIC KEY-----\n',
                rsaPassPhrase: 'mFHOkp8ir8thxgH3d89DuWTA9TxRqbKLt886x60rRNu1Gh00G0BqLAbJ8e3Yg4Pq9vnZdvIDuIUG8M981NO4Tg==',
                walletAddress: '0x9ef591a7cfDE1257869DAf618cD5e7acE1E7d0Bb',
                walletPrivateKey: '0x8c3e70286b67e0e13d0156299d72dbd83ed8bf44ea0cb5c45f51e43d4a9ee131'
            };
            keyHelper.generateAddressAndPrivateKeyPair = sandbox.stub().returns(accountDetails);

            mycareController.generateChainAccount(req, res);

            sandbox.assert.called(keyHelper.generateAddressAndPrivateKeyPair);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
            sandbox.assert.calledWith(resJSON, accountDetails);
        });

        it('returns status code 500 if unexpected error occurs', () => {
            const req = {
                user: {
                    _id: 'djdjddddndmcdjddjddhdbdddh'
                }
            };
            keyHelper.generateAddressAndPrivateKeyPair = sandbox.stub().throws('File system error');

            mycareController.generateChainAccount(req, res);

            sandbox.assert.called(keyHelper.generateAddressAndPrivateKeyPair);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
            });
        });
    });

    describe('validateAccountParams', () => {
        it('returns status 400 if any required params missing', () => {
            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    walletAddress,
                    timestamp
                }
            };

            const next = sandbox.spy();

            const expectedParams = ['walletAddress', 'profileHash', 'timestamp'];

            mycareController.validateAccountParams(req, res, next, expectedParams);

            sandbox.assert.notCalled(next);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: `profileHash is a required parameter`
            });
        });

        it('returns status 400 if timestamp is invalid', () => {
            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    walletAddress,
                    timestamp: 'August 35 2019'
                }
            };

            const next = sandbox.spy();

            const expectedParams = ['walletAddress', 'timestamp'];

            mycareController.validateAccountParams(req, res, next, expectedParams);

            sandbox.assert.notCalled(next);
            sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: 'timestamp is not valid ISO8601 string'
            });
        });

        it('calls next if parameters are validated successfully', () => {
            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    walletAddress,
                    timestamp: '2018-12-08T23:00:00.000Z'
                }
            };

            const next = sandbox.spy();

            const expectedParams = ['walletAddress', 'timestamp'];

            mycareController.validateAccountParams(req, res, next, expectedParams);

            sandbox.assert.called(next);
        });

        it('returns status 500 if an unexpected error occurs', () => {
            const req = {
                user: {
                    _id: 'dhddkdkdkdddkddldldldl'
                },
                body: {
                    walletAddress,
                    timestamp: '2018-12-08T23:00:00.000Z'
                }
            };

            const next = sandbox.stub().throws('Unexpected error');

            const expectedParams = ['walletAddress', 'timestamp'];

            mycareController.validateAccountParams(req, res, next, expectedParams);

            sandbox.assert.called(next);

            sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
            sandbox.assert.calledWith(resJSON, {
                message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
            });
        });
    });
});