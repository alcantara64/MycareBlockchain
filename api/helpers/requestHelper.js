const MAX_DB_RESULT_SIZE = 500;

exports.computeQueryResultLimit = function(startFrom = 1, limitTo = 100) {
    const startIndex = +startFrom < 1 ? 0 : +startFrom - 1;
    const size = +limitTo <= MAX_DB_RESULT_SIZE ? +limitTo : MAX_DB_RESULT_SIZE;
    return { startFrom: startIndex, limitTo: size };
};