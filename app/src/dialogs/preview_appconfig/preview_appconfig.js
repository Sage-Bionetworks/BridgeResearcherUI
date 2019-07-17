import Binder from "../../binder";
import jsonFormatter from "../../json_formatter";
import Promise from "bluebird";
import root from "../../root";
import serverService from "../../services/server_service";

export default function(params) {
  let self = this;
  let appConfig = params.appConfig;

  new Binder(self).obs("content").obs("errors[]", []);
  self.close = root.closeDialog;

  let map = appConfig.configReferences.reduce((map, ref) => {
    map[ref.id] = ref.revision;
    return map;
  }, {});

  let elementIds = Object.keys(map);

  function errorHandler(e) {
    self.errorsObs.push(e.responseJSON.message);
  }

  Promise.each(elementIds, id => {
    return serverService
      .getAppConfigElement(id, map[id])
      .then(el => (appConfig.configElements[el.id] = el.data))
      .catch(errorHandler);
  })
    .then(() => self.contentObs(jsonFormatter.prettyPrint(appConfig)))
    .catch(errorHandler);
};
