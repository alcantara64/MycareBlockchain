const variance = 100000;

function computeGasLimit(limit) {
    return limit + variance;
}

exports.GAS_LIMIT = {
    MYCARE: {
        ADD_ACCOUNT: computeGasLimit(250959),
        DEACTIVATE_ACCOUNT: computeGasLimit(18891)
    },
    SHARED_ACCESS: {
        ADD_CONNECTION_ATTEMPT: computeGasLimit(133603),
        UPDATE_CONNECTION_ATTEMPT: computeGasLimit(34046),
        ADD_CONSENT: computeGasLimit(241238),
        REVOKE_CONSENT: computeGasLimit(34077)
    },
    POLICIES_AND_TERMS: {
        ADD_NEW_DOCUMENT: computeGasLimit(295149),
        SAVE_ACCEPTANCE: computeGasLimit(193401)
    }
};