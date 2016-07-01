var expect = require('chai').expect;
var rewire =  require('rewire');
var sinon = require('sinon');
var stubs = require('../../stubs');
var serverService = stubs.serverService;

var CACHE_KEYS = ['CCC','BBB','AAA'];

var CacheViewModel = rewire('../../../app/src/pages/admin/cache/cache');
CacheViewModel.__set__({
    'serverService': serverService
        .doReturn('deleteCacheKey', {message: "Cache key deleted."})
        .doReturn('getCacheKeys', CACHE_KEYS),
    'tables': stubs.tables
});

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
        expect(serverService.deleteCacheKey.calledTwice).to.be.true;
        expect(serverService.deleteCacheKey.firstCall.args[0]).to.eql('AAA');
        expect(serverService.deleteCacheKey.secondCall.args[0]).to.eql('CCC');
    });
});