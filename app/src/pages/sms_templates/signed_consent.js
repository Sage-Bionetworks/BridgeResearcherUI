import SmsViewModel from './sms_view_model';

module.exports = class SmsSignedConsentTemplate extends SmsViewModel {
    constructor() {
        super('signedConsentSmsTemplate');
    }
    getSampleURL() {
        return "https://org-sagebridge-usersigned-consents-prod.s3.amazonaws.com/#####################.pdf";
    }
};