import {serverService} from '../../services/server_service';
import fn from '../../functions';
import ko from 'knockout';
import root from '../../root';
import tables from '../../tables';
import utils from '../../utils';

/**
 * params:
 *  selectOne: allow selection of only one element
 *  addConfigs: function to receive selected schemas(s)
 *  selected: config list
 */
module.exports = function(params) {
    let self = this;

    self.title = params.selectOne ? 'Select Config' : 'Select Configs';
    self.controlName = params.selectOne ? 'ui-radio' : 'ui-checkbox';
    self.cancel = root.closeDialog;
    
    function selectById(selConfigId)  {
        return function(item) {
            return item.id === selConfigId;
        };
    }
    function selectByChecked(item) {
        return item.checkedObs();
    }

    self.select = function() {
        let filterFunc = (params.selectOne) ?
            selectById($("input[type=radio]:checked").toArray()[0].id.substring(1)) :
            selectByChecked;
        let configs = self.itemsObs().filter(filterFunc);
        params.addConfigs(configs);
    };

    tables.prepareTable(self, {
        name: "config element",
        type: "AppConfigElement",
        refresh: load
    });

    function match(config) {
        return params.selected.filter(function(selectedConfig) {
            return (selectedConfig.id === config.id);
        })[0];
    }
    function configToView(config) {
        let selectedConfig = match(config);
        let checked = !!selectedConfig;
        selectedConfig = selectedConfig || {};
        return {
            id: selectedConfig.id || config.id, 
            name: selectedConfig.id || config.id,
            revision: selectedConfig.revision || config.revision,
            checkedObs: ko.observable(checked)
        };
    }

    function load() { 
        serverService.getAppConfigElements()
            .then(fn.handleMap('items', configToView))
            .then(fn.handleSort('items','id'))
            .then(fn.handleObsUpdate(self.itemsObs, 'items'))
            .catch(utils.failureHandler());
    }
    load();
};
