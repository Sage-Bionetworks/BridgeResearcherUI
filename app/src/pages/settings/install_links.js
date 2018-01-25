import {serverService}  from '../../services/server_service';
import Binder from '../../binder';
import root from '../../root';
import utils from '../../utils';

const IOS = "iPhone OS";
const ANDROID = "Android";
const UNIVERSAL = "Universal";

module.exports = function() {
    var self = this;

    var binder = new Binder(self)
        .obs('ios')
        .obs('android')
        .obs('universal');

    function setValue(fieldName, value) {
        if (value) {
            self.study.installLinks[fieldName] = value;
        } else {
            delete self.study.installLinks[fieldName];
        }
    }

    self.save = function(vm, event) {
        setValue(IOS, self.iosObs());
        setValue(ANDROID, self.androidObs());
        setValue(UNIVERSAL, self.universalObs());
    
        utils.startHandler(vm, event);
        serverService.saveStudy(self.study)
            .then(utils.successHandler(vm, event, "Install links saved."))
            .catch(utils.failureHandler());
    };
            
    serverService.getStudy()
        .then(function(study) {
            self.study = study;
            self.iosObs(study.installLinks[IOS]);
            self.androidObs(study.installLinks[ANDROID]);
            self.universalObs(study.installLinks[UNIVERSAL]);
        });
};