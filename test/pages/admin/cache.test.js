var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var Promise = require('../../dummy_promise');

var CACHE_KEYS = ['CCC','BBB','AAA'];

var CacheViewModel = rewire('../../../app/src/pages/admin/cache/cache');

var tables = rewire('../../../app/src/tables');
tables.__set__('alerts', {
    deleteConfirmation: function(message, func, deleteButton) {
        func();
    }
});
var deleteStub = sinon.stub().returns(new Promise({message: "Cache key deleted."}));
var getStub = sinon.stub().returns(new Promise(CACHE_KEYS));
CacheViewModel.__set__("serverService", {deleteCacheKey: deleteStub, getCacheKeys: getStub});
CacheViewModel.__set__("tables", tables);

describe("Admin/CacheViewModel", function() {
    it("works", function() {
        var view = new CacheViewModel();

        expect(view.itemsObs().length).to.equal(3);

        expect(view.atLeastOneChecked()).to.be.false;
        view.itemsObs()[0].checkedObs(true);
        view.itemsObs()[1].checkedObs(true);
        view.itemsObs()[1].checkedObs(false);
        view.itemsObs()[2].checkedObs(true);
        expect(view.atLeastOneChecked()).to.be.true;

        view.deleteItems(view);
        expect(deleteStub.calledTwice).to.be.true;
        expect(deleteStub.firstCall.args[0]).to.eql('AAA');
        expect(deleteStub.secondCall.args[0]).to.eql('CCC');
    });
});