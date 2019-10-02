import serverService from '../../services/server_service';
import ko from 'knockout';

export default function(params) {
  let self = this;

  self.fileInfo = {};

  self.closeDialog = params.closeFunc;
  self.uploadAndClose = () => {
    let f = self.fileInfo;
    let rev = {
      description: `name=${f.name}, size=${f.size}, mimeType=${f.type}`,
      mimeType: f.type
    };
    serverService.createFileRevision(params.guid, rev).then((revision) => {
      var formData = new FormData();
      formData.append('file', f);

      var request = new XMLHttpRequest();
      request.addEventListener('readystatechange', (e) => {
        if (e.target.readyState === 4) {
          if (e.target.status !== 200) {
            self.statusObs(e.target.responseText);
          } else {
            self.statusObs('Upload completed');
          }
        }
      });
      request.upload.addEventListener('loadstart', () => self.statusObs('Upload started'));
      request.upload.addEventListener('abort', () => self.statusObs('Upload aborted'));
      request.upload.addEventListener('timeout', () => self.statusObs('Upload timed out'));
      request.upload.addEventListener('error', (e) => self.statusObs('Upload error: ' + JSON.stringify(e)));
      request.upload.addEventListener('load', (e) => self.statusObs('Upload being processed'));
      request.upload.addEventListener('progress', (e) => self.statusObs('Progress: ' + (e.loaded/e.total*100) + '%'));
      request.open('PUT', revision.uploadURL, true);
      request.setRequestHeader('Content-Type', f.type);
      request.send(formData);
      return false;
    });
  };

  self.disabledObs = ko.observable(true);
  self.nameObs = ko.observable('Select File');
  self.statusObs = ko.observable('');

  self.updateFileControl = function(vm, event) {
    self.fileInfo = event.target.files[0];
    let f = self.fileInfo;
    self.statusObs(f.description);
    self.nameObs(f.name);
    self.disabledObs(false);
  }
}
