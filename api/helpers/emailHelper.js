const appRoot = require('app-root-path');
const handlebars = require('handlebars');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require(`${appRoot}/config/winston`);
const envHelper = require(`${appRoot}/api/helpers/envHelper`);

const envConstants = envHelper.getConstants();

exports.createEmailTemplate = function createEmailTemplate(templateName, templateVariables) {
    let path = `${appRoot}/public/templates/${templateName}.html`;
    let html = fs.readFileSync(path, 'utf8');

    var template = handlebars.compile(html);

    return template(templateVariables);
};

exports.sendMail = function sendEmail(to, subject, templateName, templateVariables) {

    return new Promise((resolve, reject) => {
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                reject('error occurred creating test account');
            }

            const transporter = nodemailer.createTransport({
                host: envConstants.EMAIL_HOST,
                port: 587,
                secureConnection: false,
                auth: {
                    user: envConstants.EMAIL_USER,
                    pass: envConstants.EMAIL_PASS
                },
                tls: {
                    // do not fail on invalid certs
                    rejectUnauthorized: false
                },
                requireTLS: true
            });

            const html = this.createEmailTemplate(templateName, templateVariables);
            const mailOptions = {
                from: '"myCareAI" <mycareai@newwave.io>',
                to,
                subject,
                text: subject,
                html
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    logger.error(`error occured sending mail ${error}`);
                    reject(error);
                }
                resolve(info);
            });
        });
    });
};