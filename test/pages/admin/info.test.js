var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var stubs = require('../../stubs');
var serverService = stubs.serverService;

var STUDY = {healthCodeExportEnabled: true, emailVerificationEnabled: false, pushNotificationARNs: {
    'iPhone OS': 'a',
    'Android': 'b'
}};

var InfoViewModel = rewire('../../../app/src/pages/admin/info/info');
InfoViewModel.__set__("serverService", serverService
    .doReturn('saveStudy', {message: "Study saved."})
    .doReturn('getStudy', STUDY)
);

describe("Admin/InfoViewModel", function() {
    it("works", function() {
        var view = new InfoViewModel();
        expect(view.healthCodeExportEnabledObs()).to.be.true;
        expect(view.emailVerificationEnabledObs()).to.be.false;
        expect(view.iosArnObs()).to.equal('a');
        expect(view.androidArnObs()).to.equal('b');
        expect(view.study).to.exist;

        view.healthCodeExportEnabledObs(false);
        view.emailVerificationEnabledObs(true);
        view.iosArnObs('ios');
        view.androidArnObs('android');
        view.save(view);

        var savedStudy = serverService.saveStudy.firstCall.args[0];
        expect(savedStudy.healthCodeExportEnabled).to.be.false;
        expect(savedStudy.emailVerificationEnabled).to.be.true;
        expect(savedStudy.pushNotificationARNs['iPhone OS']).to.equal('ios');
        expect(savedStudy.pushNotificationARNs['Android']).to.equal('android');
        expect(serverService.saveStudy.firstCall.args[1]).to.be.true;
    });
});
