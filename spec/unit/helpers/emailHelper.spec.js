const sinon = require('sinon');
const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const dotenv = require('dotenv');
const chai = require('chai');
dotenv.config();

let sandbox = sinon.createSandbox();

describe('EmailHelper', () => {
    let fs;
    let handlebars;
    let emailHelper;
    let nodemailer;
    let sendMail;

    let operationError;
    let operationResult;
    let envHelper;

    const env = {
        EMAIL_USER: 'mycareai@newwave.io',
        EMAIL_PASS: 'AA@Pwise1',
        EMAIL_HOST: 'office.mssoft.com'
    };

    beforeEach(() => {
        operationError = null;
        operationResult = {};

        envHelper = {
            getConstants() {
                return { ...env };
            }
        };

        sendMail = (mailOptions, callback) => {
            callback(operationError, operationResult);
        };

        nodemailer = {
            createTestAccount(callback) {

                callback(operationError, operationResult);
            },
            createTransport(config) {
                return {
                    sendMail
                };
            }
        };

        fs = {
            readFileSync: (path, options) => {
                return `html_str`;
            }
        };

        handlebars = {
            compile: (html) => {
                return (templateVars) => '<div></div>';
            }
        };

        emailHelper = proxyquire(`${appRoot}/api/helpers/emailHelper`, {
            'fs': fs,
            'nodemailer': nodemailer,
            'handlebars': handlebars,
            [`${appRoot}/api/helpers/envHelper`]: envHelper
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('createEmailTemplate finds html template using passed in template name', () => {
        fs.readFileSync = sandbox.stub();
        fs.readFileSync.returns('any string buffer');

        let templateName = 'signin';
        let path = appRoot + '/public/templates/' + templateName + '.html';

        emailHelper.createEmailTemplate(templateName, {});

        sandbox.assert.calledWith(fs.readFileSync, path);
    });

    it('createEmailTemplate should compile html and pass in variables', () => {
        let templateName = 'signin';
        let templateVariables = {
            firstName: 'John',
            lastName: 'Doe'
        };

        let template = sandbox.stub();
        template.returns('<div></div>');

        handlebars.compile = sandbox.stub();

        handlebars.compile.returns(template);

        emailHelper.createEmailTemplate(templateName, templateVariables);

        sinon.assert.calledWith(handlebars.compile, 'html_str');

        sinon.assert.calledWith(template, templateVariables);
    });

    it('creates transport when sendmail is called', () => {
        emailHelper.createEmailTemplate = (templateName, templateVariables) => {
            return '<div></div>'
        }

        let to = 'a@b.com';
        let subject = 'Change your surname';
        let templateName = 'changeSurname';
        let templateVariables = {};

        let config = {
            host: env.EMAIL_HOST,
            port: 587,
            secureConnection: false,
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            },
            requireTLS: true
        }

        nodemailer.createTransport = sandbox.stub();
        nodemailer.createTransport.returns({
            sendMail
        })

        emailHelper.sendMail(to, subject, templateName, templateVariables);

        sinon.assert.calledWith(nodemailer.createTransport, config);
    });

    it('creates html templates when sendMail is called', async () => {
        emailHelper.createEmailTemplate = (templateName, templateVariables) => {
            return '<div></div>'
        }

        let to = 'a@b.com';
        let subject = 'Change your surname';
        let templateName = 'changeSurname';
        let templateVariables = {
            firstName: 'Maxwell'
        };

        emailHelper.createEmailTemplate = sandbox.stub();
        emailHelper.createEmailTemplate.returns('html_str');

        emailHelper.sendMail(to, subject, templateName, templateVariables)
            .then(() => {
                sinon.assert.calledWith(emailHelper.createEmailTemplate, templateName, templateVariables);
            }, (error) => {
                console.error(error);
            })
    })

    it('should send mail', () => {
        emailHelper.createEmailTemplate = (templateName, templateVariables) => {
            return '<div></div>'
        }

        let to = 'a@b.com';
        let subject = 'Change your surname';
        let templateName = 'changeSurname';
        let templateVariables = {};

        let config = {
            host: env.EMAIL_HOST,
            port: 587,
            secureConnection: false,
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS
            },
            tls: {
                // do not fail on invalid certs
                rejectUnauthorized: false
            },
            requireTLS: true
        }

        let mailOptions = {
            from: '"myCareAI" <mycareai@newwave.io>',
            to: to,
            subject: subject,
            text: subject,
            html: '<div></div>'
        };

        sendMail = sandbox.stub();

        let result = emailHelper.sendMail(to, subject, templateName, templateVariables);

        sinon.assert.calledWith(sendMail, mailOptions);
    })
})