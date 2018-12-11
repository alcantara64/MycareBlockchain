// checks payload properties to see if all required fields are present
exports.validateRequiredParams = function (payload, requiredFields) {
    const result = {
        message: '',
        missingParam: false
    };
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        const val = payload[field];

        if (!val && val !== 0 && val !== false) {
            result.missingParam = true;
            result.message = `${field} is required`;
            return result;
        }
    }

    return result;
};