const appRoot = require('app-root-path');
const Client = require(`${appRoot}/api/models/clientModel`);

exports.getOne = function (query) {
    return Client.findOne(query);
};

exports.get = function (query = {}, startFrom, limitTo) {
    return Client.find(query).sort({
        name: 'desc'
    }).skip(startFrom).limit(limitTo);
};

exports.create = function (payload) {
    return Client.create(payload);
};

exports.update = function (query, newValues) {
    return Client.findOneAndUpdate(query, newValues);
};
