import SmsViewModel from './sms_view_model';

module.exports = class SmsAppInstallLinkTemplate extends SmsViewModel {
    constructor() {
        super('appInstallLinkSmsTemplate');
    }
    getSampleURL() {
        var string = "NO VALUE";

        var values = Object.values(this.study.installLinks);
        for (var i=0; i < values.length; i++) {
            var oneString = values[i];
            if (oneString.length > string.length) {
                string = oneString;
            }
        }
        return string;
    }
};