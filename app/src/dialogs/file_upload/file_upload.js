import serverService from '../../services/server_service';
import Binder from '../../binder';
import utils from '../../utils';

function promiseXHR() {
  const request = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response);
      } else {
        reject(request.statusText);
      }
    };
    request.onerror = () => reject(request.statusText);
  });
  return [promise, request];
}

export default function(params) {
  const self = this;

  new Binder(self)
    .obs('disabled', true)
    .obs('name', 'Select File')
    .obs('status')
    .obs('description')
    .obs('value', 0)
    .obs('max', 100)
    .obs('percentage', '0%')
    .obs('error');

  function ok(status) {
    self.statusObs(status);
    self.errorObs('');
  }
  function error(error) {
    self.statusObs('Upload failed');
    self.errorObs(error);
  }
  function updateProgress(e) {
    self.valueObs(e.loaded);
    self.maxObs(e.total);
    self.percentageObs(Math.round(e.loaded/e.total*100) + '%');
  }

  self.fileInfo = {};
  self.revision = null;
  self.closeDialog = params.closeFunc;

  self.uploadAndClose = (vm, event) => {
    let f = self.fileInfo;
    let rev = {
      name: f.name,
      size: f.size,
      description: self.descriptionObs(),
      mimeType: f.type
    };
    utils.startHandler(vm, event);
    serverService.createFileRevision(params.guid, rev).then((revision) => {
      self.revision = revision;
      
      let [promise, request] = promiseXHR();

      const reader = new FileReader(); 
      reader.onload = function(evt) {
        request.upload.addEventListener('loadstart', () => ok('Upload started'));
        request.upload.addEventListener('abort', () => error('Request aborted.'));
        request.upload.addEventListener('timeout', () => error('Upload timed out'));
        request.upload.addEventListener('progress', updateProgress);
        request.open('PUT', revision.uploadURL, true);
        request.setRequestHeader('Content-Type', f.type);
        request.setRequestHeader('Content-Disposition', `attachment; filename="${f.name}"`);
        request.send(evt.target.result);
      };
      reader.readAsArrayBuffer(self.fileInfo);
      return promise;
    })
    .then(() => {
      ok('Upload completed');
      return serverService.finishFileRevision(params.guid, self.revision.createdOn);
    })
    .then(params.closeFunc)
    .catch((e) => {
      utils.failureHandler(vm, event)(e);
      error(e.statusText);
    });
  };
  self.updateFileControl = function(vm, event) {
    self.fileInfo = event.target.files[0];
    let f = self.fileInfo;
    self.statusObs(f.description);
    self.nameObs(f.name);
    self.disabledObs(false);
  }
}
