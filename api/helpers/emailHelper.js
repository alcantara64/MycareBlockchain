const appRoot = require('app-root-path');
const dotenv = require('dotenv');
const handlebars = require('handlebars');
const fs = require('fs');
const nodemailer = require('nodemailer');
const logger = require(`${appRoot}/config/winston`);

dotenv.config();

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
                reject('error occured creating test account');
            }

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: 587,
                secureConnection: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
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