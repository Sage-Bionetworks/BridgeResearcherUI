import sharedModuleUtils from '../../shared_module_utils';
import root from '../../root';

/**
 * params:
 *  publishFunc
 *  importFunc
 *  deleteFunc
 *  model - the shared module object
 */
module.exports = function(params) {
    var self = this;
    
    self.isAdmin = root.isAdmin;
    self.model = params.model;
    self.isImported = !!params.importFunc && params.isImported(params.model);
    var url = '#/shared_modules/'+encodeURIComponent(self.model.id);

    Object.assign(self, sharedModuleUtils);

    ['import','publish','delete','deletePermanently'].forEach(function(methName) {
        self[methName+'On'] = !!params[methName+'Func'];
        self[methName+'Func'] = function(item, event) {
            params[methName+'Func'](self.model, event);
        };
    });
    self.link = function() {
        return (self.deleteOn) ? {'href': url} : {};
    };
};