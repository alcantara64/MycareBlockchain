const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

describe('ClientService', () => {
    let clientService;
    let Client;
    beforeEach(() => {
        Client = {};
        const imports = {};
        imports[`${appRoot}/api/models/clientModel`] = Client;

        clientService = proxyquire(`${appRoot}/api/services/clientService`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can get one client', () => {
        const query = {
            _id: 'hdddddjniunieokdmdiem'
        };

        Client.findOne = sandbox.stub();

        clientService.getOne(query);

        sandbox.assert.calledWith(Client.findOne, query);
    });

    it('can get multiple clients', () => {
        const query = {};
        const startFrom = 34;
        const limitTo = 70;

        const limit = sandbox.spy();

        const skip = sandbox.stub().returns({ limit });

        const sort = sandbox.stub().returns({ skip });

        Client.find = sandbox.stub().returns({ sort });

        clientService.get(query, startFrom, limitTo);

        sandbox.assert.calledWith(sort, { name: 'desc' });
        sandbox.assert.calledWith(skip, startFrom);
        sandbox.assert.calledWith(limit, limitTo);

        sandbox.assert.calledWith(Client.find, query);
    });

    it ('can create a client', () => {
        const payload = {
            _id: 'hdddddjniunieokdmdiem'
        };

        Client.create = sandbox.stub();

        clientService.create(payload);

        sandbox.assert.calledWith(Client.create, payload);
    });

    it ('can update a client', () => {
        const query = {
            _id: 'hdddddjniunieokdmdiem'
        };

        const values = {
            name: 'eob-API'
        };

        Client.findOneAndUpdate = sandbox.stub();

        clientService.update(query, values);

        sandbox.assert.calledWith(Client.findOneAndUpdate, query, values);
    });

    it ('can delete a client', () => {
        const id = 'hdddddjniunieokdmdiem';

        Client.findOneAndRemove = sandbox.stub();

        clientService.delete(id);

        sandbox.assert.calledWith(Client.findOneAndRemove, { _id: id });
    });
});