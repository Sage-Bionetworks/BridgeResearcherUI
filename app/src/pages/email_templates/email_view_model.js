import {serverService} from '../../services/server_service';
import ko from 'knockout';
import utils from '../../utils';

export default class EmailViewModel {
    constructor(templateName) {
        this.templateName = templateName;
        this.study = null;
        this.editor = null;
        this.subjectObs = ko.observable("");
        this.studyIdObs = ko.observable();

        this.initEditor = (ckeditor) => {
            this.editor = ckeditor;
            serverService.getStudy().then((study) => {
                this.study = study;
                this.studyIdObs(study.identifier);
                this.subjectObs(study[this.templateName].subject);
                this.editor.setData(study[this.templateName].body);
                this.postLoad(study);
            }).catch(utils.failureHandler());
        };
    }
    postLoad(study) {
    }
    preSave(study) {
    }
    save(vm, event) {
        this.study[this.templateName] = {
            subject: this.subjectObs(),
            body: this.editor.getData()
        };
        this.preSave(this.study);
        
        utils.startHandler(this, event);
        serverService.saveStudy(this.study)
            .then(utils.successHandler(vm, event, "Template saved."))
            .catch(utils.failureHandler());
    }
    dispose() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
}