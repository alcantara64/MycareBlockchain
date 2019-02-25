const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: 'string',
        unique: true,
        trim: true,
        required: true
    },
    email: {
        type: 'string'
    },
    clientId: {
        type: 'string'
    },
    clientSecret: {
        type: 'string'
    },
    role: {
        type: Array
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);