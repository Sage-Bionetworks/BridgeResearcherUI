import SmsViewModel from './sms_view_model';
import ko from 'knockout';

module.exports = class SmsAccountExistsTemplate extends SmsViewModel {
    constructor() {
        super('accountExistsSmsTemplate');
        this.autoVerificationPhoneEnabledObs = ko.observable();
    }
    getSampleURL() {
        return "https://ws.sagebridge.org/rp?study="+
            this.study.identifier+"&sptoken=#####################";
    }
    postLoad(study) {
        this.autoVerificationPhoneEnabledObs(!study.autoVerificationPhoneSuppressed);
    }
    preSave(study) {
        study.autoVerificationPhoneSuppressed = !this.autoVerificationPhoneEnabledObs();
    }
};
