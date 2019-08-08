const winston = require('winston');
const fs = require('fs');
const logDir = process.env.LOG_DIR;
if (!fs.existsSync(logDir)) {
    fs.mkdir(logDir);
}

const options = {
    file: {
        level: 'info',
        filename: `${logDir}/info.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true
    }
};

const logsFormat = winston.format.printf((infoObj) => {
    const { level, message, timestamp, ...meta } = infoObj;
    const { deviceId, userId } = meta;
    let deviceLog = '';
    let userLog = '';
    if (deviceId) {
        if (typeof deviceId !== 'string') throw new Error('deviceId must be a string');
        deviceLog = `, deviceId: "${deviceId}"`;
    }

    if (userId) {
        if (typeof userId !== 'string') throw new Error('userId must be a string');
        userLog = `, userId: "${userId}"`;
    }

    return `${timestamp} - { message: "${message}", level: "${level}"${deviceLog}${userLog} }`;
});

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        logsFormat
    ),
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write(message, encoding) {
        logger.info(message);
    }
};

module.exports = logger;