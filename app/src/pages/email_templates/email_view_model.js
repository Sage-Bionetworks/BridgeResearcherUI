import ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

export default class EmailViewModel {
    constructor(templateName) {
        this.templateName = templateName;
        this.study = null;
        this.editor = null;
        this.subjectObs = ko.observable("");

        this.initEditor = function(ckeditor) {
            this.editor = ckeditor;
            serverService.getStudy().then(function(study) {
                this.study = study;
                this.subjectObs(study[this.templateName].subject);
                this.editor.setData(study[this.templateName].body);
            }.bind(this)).catch(utils.failureHandler());
        }.bind(this);
    }
    save(vm, event) {
        this.study[this.templateName] = {
            subject: this.subjectObs(),
            body: this.editor.getData()
        };
        
        utils.startHandler(this, event);
        serverService.saveStudy(this.study)
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler());
    }
    dispose() {
        if (this.editor) {
            this.editor.destroy();
        }
    }
}