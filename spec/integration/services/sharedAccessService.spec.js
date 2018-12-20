const appRoot = require('app-root-path');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

describe('SharedAccessService', () => {
    let sharedAccessService;
    let contractHelper;
    let contractMethods;

    beforeEach(() => {
        const imports = {};
        contractMethods = {};

        function ContractHelperConstructor(contractName) {
            this.instance = sandbox.stub();
            this.instance(contractName);

            this.contractMethods = sandbox.stub().returns(contractMethods);
        };

        contractHelper = {
            contractNames: {
                MYCARE: 'MyCare',
                SHARED_ACCESS: 'SharedAccess',
                POLICIES_AND_TERMS: 'PoliciesAndTerms'
            },
            ContractHelper: ContractHelperConstructor
        };

        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;

        sharedAccessService = proxyquire(`${appRoot}/api/services/sharedAccessService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can convert integers to bytes', () => {
        const num1 = 2 ** 112;
        const num2 = 2 ** 113;

        const num3 = 2 ** 110;

        const integers = [num1, num2];

        const scope = sharedAccessService.integersToBytes(integers);

        const num1InScope = sharedAccessService.scopeContainsInteger(scope, num1);

        const num2InScope = sharedAccessService.scopeContainsInteger(scope, num2);
        const num3InScope = sharedAccessService.scopeContainsInteger(scope, num3);

        chai.assert(num1InScope === true);
        chai.assert(num2InScope === true);
        chai.assert(num3InScope === false, 'expected num3InScope to be true');
    });
});