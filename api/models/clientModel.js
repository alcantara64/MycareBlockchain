const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: 'string'
    },
    email: {
        type: 'string'
    },
    clientId: {
        type: 'string'
    },
    clientSecret: {
        type: 'string'
    }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);