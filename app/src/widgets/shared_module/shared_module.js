import sharedModuleUtils from '../../shared_module_utils';

/**
 * params:
 *  publishFunc
 *  importFunc
 *  deleteFunc
 *  model - the shared module object
 */
module.exports = function(params) {
    var self = this;
    
    self.model = params.model;
    self.isImported = !!params.importFunc && params.isImported(params.model);
    var url = '#/shared_modules/'+encodeURIComponent(self.model.id);

    Object.assign(self, sharedModuleUtils);

    ['import','publish','delete'].forEach(function(methName) {
        self[methName+'On'] = !!params[methName+'Func'];
        self[methName+'Func'] = function(item, event) {
            params[methName+'Func'](self.model, event);
        };
    });
    self.link = function() {
        return (self.deleteOn) ? {'href': url} : {};
    };
};