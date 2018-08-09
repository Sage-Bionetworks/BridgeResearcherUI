import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import root from '../../root';
import fn from '../../functions';

module.exports = function(params) {
    let self = this;
    self.studyId = null;

    new Binder(self)
        .obs('dateFormatting', localStorage.getItem('timezone') || 'local')
        .obs('study')
        .obs('studyOptions[]');

    fn.copyProps(self, root, 'closeDialog', 'isAdmin');
    
    self.save = function(vm, event) {
        localStorage.setItem('timezone', self.dateFormattingObs());
        
        let p = Promise.resolve();
        if (self.studyId !== self.studyObs()) {
            let studyName = findStudyName(self.studyObs());
            p = serverService.changeAdminStudy(studyName, self.studyObs());
        }
        p.then(() => setTimeout(() => document.location.reload(), 100));
    };

    function findStudyName(studyId) {
        return self.studyOptionsObs()
            .filter((option) => option.identifier === studyId)[0].name;
    }

    serverService.getSession().then((session) => {
        self.studyId = session.studyId;
        return session.environment;
    }).then((env) => {
        return serverService.getStudyList(env);
    }).then((response) => {
        self.studyOptionsObs(response.items);
        return serverService.getStudy();
    }).then((study) => {
        self.studyObs(study.identifier);
    });
};
