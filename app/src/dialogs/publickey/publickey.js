import Binder from "../../binder";
import root from "../../root";
import serverService from "../../services/server_service";

export default function(params) {
  let self = this;

  new Binder(self)
    .obs("downloadHref", params.app.identifier + ".pem")
    .obs("downloadFileName", "")
    .obs("content");
  self.close = root.closeDialog;

  serverService.getAppPublicKey().then(function(response) {
    let fileContents = "data:text/plain;charset=utf-8," + encodeURIComponent(response.publicKey);
    self.contentObs(response.publicKey);
    self.downloadFileNameObs(fileContents);
  });
};
