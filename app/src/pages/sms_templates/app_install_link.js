import SmsViewModel from './sms_view_model';

module.exports = class SmsAppInstallLinkTemplate extends SmsViewModel {
    constructor() {
        super('appInstallLinkSmsTemplate');
    }
    getSampleURL() {
        let string = "NO VALUE";

        let values = Object.values(this.study.installLinks);
        for (let i=0; i < values.length; i++) {
            let oneString = values[i];
            if (oneString.length > string.length) {
                string = oneString;
            }
        }
        return string;
    }
};