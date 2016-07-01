var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var Promise = require('../../dummy_promise');
var InfoViewModel = rewire('../../../app/src/pages/admin/info/info');

// stub out serverService
var saveStub = sinon.stub().returns(new Promise({message: "Study saved."}));
var getStub = sinon.stub().returns(
    new Promise({healthCodeExportEnabled: true, emailVerificationEnabled: false}));
InfoViewModel.__set__("serverService", {saveStudy: saveStub, getStudy: getStub});

describe("Admin/InfoViewModel", function() {
    it("works", function() {
        var view = new InfoViewModel();
        expect(view.healthCodeExportEnabledObs()).to.be.true;
        expect(view.emailVerificationEnabledObs()).to.be.false;
        expect(view.study).to.exist;

        view.healthCodeExportEnabledObs(false);
        view.emailVerificationEnabledObs(true);
        view.save(view);

        var savedStudy = saveStub.firstCall.args[0];
        expect(savedStudy.healthCodeExportEnabled).to.be.false;
        expect(savedStudy.emailVerificationEnabled).to.be.true;
        expect(saveStub.firstCall.args[1]).to.be.true;
    });
});
