import SmsViewModel from './sms_view_model';

module.exports = class SmsAccountExistsTemplate extends SmsViewModel {
    constructor() {
        super('accountExistsSmsTemplate');
    }
    getSampleURL() {
        return "https://ws.sagebridge.org/rp?study="+
            this.study.identifier+"&sptoken=#####################";
    }
};