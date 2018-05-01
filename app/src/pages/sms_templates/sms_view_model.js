import {serverService} from '../../services/server_service';
import ko from 'knockout';
import utils from '../../utils';

export default class SmsViewModel {
    constructor(templateName) {
        this.templateName = templateName;
        this.study = null;
        this.studyIdObs = ko.observable();
        this.messageObs = ko.observable('');
        this.formattedMessageObs = ko.computed(() => {
            return this.formatMessage();
        });        
        serverService.getStudy().then((study) => {
            this.study = study;
            this.studyIdObs(study.identifier);
            if (study[this.templateName]) {
                this.messageObs(study[this.templateName].message);
            }
            this.postLoad(study);
        }).catch(utils.failureHandler());        
    }
    postLoad(study) {
    }
    preSave(study) {
    }
    getSampleURL() {
        return "";
    }
    formatMessage() {
        let string = this.messageObs();
        if (this.study) {
            let studyShortName = this.study.shortName || "Bridge";
            string = string.split("${studyShortName}").join(studyShortName);
            string = string.split("${sponsortName}").join(this.study.sponsorName);
            string = string.split("${supportEmail}").join(this.study.supportEmail);
            string = string.split("${expirationPeriod}").join("# hours");
            string = string.split("${resetPasswordExpirationPeriod}").join("# hours");
            string = string.split("${phoneSignInExpirationPeriod}").join("# hours");
            string = string.split("${url}").join(this.getSampleURL());
            string = string.split("${resetPasswordUrl}").join(this.getSampleURL());
            string = string.split("${consentUrl}").join(this.getSampleURL());
            string = string.split("${token}").join("###-###");
        }
        return string;
    }
    save(vm, event) {
        this.study[this.templateName] = {
            message: this.messageObs()
        };
        this.preSave(this.study);
        
        utils.startHandler(this, event);
        serverService.saveStudy(this.study)
            .then(utils.successHandler(vm, event, "Template saved."))
            .catch(utils.failureHandler());
    }
}