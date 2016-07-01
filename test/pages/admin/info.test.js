var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var stubs = require('../../stubs');
var serverService = stubs.serverService;

var STUDY = {healthCodeExportEnabled: true, emailVerificationEnabled: false};

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
        expect(view.study).to.exist;

        view.healthCodeExportEnabledObs(false);
        view.emailVerificationEnabledObs(true);
        view.save(view);

        var savedStudy = serverService.saveStudy.firstCall.args[0];
        expect(savedStudy.healthCodeExportEnabled).to.be.false;
        expect(savedStudy.emailVerificationEnabled).to.be.true;
        expect(serverService.saveStudy.firstCall.args[1]).to.be.true;
    });
});
