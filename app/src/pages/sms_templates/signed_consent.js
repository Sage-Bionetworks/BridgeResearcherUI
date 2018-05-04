import SmsViewModel from './sms_view_model';

module.exports = class SmsSignedConsentTemplate extends SmsViewModel {
    constructor() {
        super('signedConsentSmsTemplate');
    }
    getSampleURL() {
        return "https://ws.sagebridge.org/r/xxxxx";
    }
};