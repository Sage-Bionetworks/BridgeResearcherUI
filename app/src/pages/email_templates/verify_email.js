import EmailViewModel from './email_view_model';
import ko from 'knockout';

module.exports = class VerifyEmailTemplate extends EmailViewModel {
    constructor() {
        super('verifyEmailTemplate');
        this.autoVerificationEnabledObs = ko.observable();
    }
    postLoad(study) {
        this.autoVerificationEnabledObs(!study.autoVerificationEmailSuppressed);
    }
    preSave(study) {
        study.autoVerificationEmailSuppressed = !this.autoVerificationEnabledObs();
    }
};
