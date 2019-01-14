const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: {
        type: 'string'
    },
    access_token: {
        type: 'string'
    },
    client_id: {
        type: 'string'
    },
    client_secret: {
        type: 'string'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Client', clientSchema);
