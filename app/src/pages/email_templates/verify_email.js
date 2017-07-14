import ko from 'knockout';
import serverService from '../../services/server_service';
import utils from '../../utils';

module.exports = function() {
    var self = this;

    self.study = null;
    self.subject = ko.observable("");
    self.editor = null;

    self.initEditor = function(ckeditor) {
        self.editor = ckeditor;
        serverService.getStudy().then(function(study) {
            self.study = study;
            self.subject(study.verifyEmailTemplate.subject);
            self.editor.setData(study.verifyEmailTemplate.body);
        });
    };

    self.save = function(vm, event) {
        utils.startHandler(self, event);
        self.study.verifyEmailTemplate.subject = self.subject();
        self.study.verifyEmailTemplate.body = self.editor.getData();

        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Email saved."))
            .catch(utils.failureHandler());
    };
};
module.exports.prototype.dispose = function() {
    if (this.editor) {
        this.editor.destroy();
    }
};