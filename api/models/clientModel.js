const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: 'string'
    },
    email: {
        type: 'string'
    },
    // accessToken: {
    //     type: 'string'
    // },
    clientId: {
        type: 'string'
    },
    clientSecret: {
        type: 'string'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Client', clientSchema);
