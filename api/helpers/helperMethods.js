exports.ISOstringToTimestamp = function(isoString) {
    const date = new Date(isoString);
    return Math.floor(date.getTime() / 1000);
};

exports.timeStampToISOstring = function (timestamp) {
    const time = Number(timestamp);
    return (new Date(time * 1000)).toISOString();
};

exports.createTimeStamp = function (timestamp) {
    return Math.floor(Date.now() / 1000);
};