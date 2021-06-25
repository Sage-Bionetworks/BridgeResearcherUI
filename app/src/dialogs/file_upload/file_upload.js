import fn from "../../functions";
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

export default class FileUpload {
  constructor(params) {

    // can also be the keyword 'logo' which follows a different upload pathway.
    fn.copyProps(this, params, 'studyId', 'guid', 'disposition', 'closeFunc->closeDialog');
    this.fileInfo = {};
    this.revision = null;
    // this.closeDialog = params.closeFunc;

    this.binder = new Binder(this)
      .obs('disabled', true)
      .obs('status')
      .obs('description')
      .obs('value', 0)
      .obs('max', 100)
      .obs('percentage', '0%')
      .obs('error');

  }
  ok(status) {
    this.statusObs(status);
    this.errorObs('');
  }
  error(error) {
    this.statusObs('Upload failed');
    this.errorObs(error);
  }
  updateProgress(e) {
    this.valueObs(e.loaded);
    this.maxObs(e.total);
    this.percentageObs(Math.round(e.loaded/e.total*100) + '%');
  }
  updateFileControl(vm, event) {
    this.fileInfo = event.target.files[0];
    this.statusObs(this.fileInfo.description);
    this.disabledObs(false);
  }
  uploadAndClose(vm, event) {
    let rev = {
      name: this.fileInfo.name,
      size: this.fileInfo.size,
      description: this.descriptionObs(),
      mimeType: this.fileInfo.type
    };
    utils.startHandler(vm, event);
    this.createFile(rev)
      .then(revision => this.startUpload(revision))
      .then(() => this.finishUpload())
      .then(this.closeDialog)
      .catch((e) => {
        utils.failureHandler(vm, event)(e);
        this.error(e.statusText);
      });
  }
  createFile(rev) {
    if (this.guid === 'logo') {
      return serverService.createLogoUpload(this.studyId, rev);
    } else {
      return serverService.createFileRevision(this.guid, rev);
    }
  }
  startUpload(revision) {
    this.revision = revision;
    let [promise, request] = promiseXHR();
    const reader = new FileReader(); 
    reader.onload = (evt) => {
      request.upload.addEventListener('loadstart', () => this.ok('Upload started'));
      request.upload.addEventListener('abort', () => this.error('Request aborted.'));
      request.upload.addEventListener('timeout', () => this.error('Upload timed out'));
      request.upload.addEventListener('progress', (e) => this.updateProgress(e));
      request.open('PUT', revision.uploadURL, true);
      request.setRequestHeader('Content-Type', this.fileInfo.type);
      let disValue = (this.disposition === 'inline') ? 
        'inline' : `attachment; filename="${this.fileInfo.name}"`;
      request.setRequestHeader('Content-Disposition', disValue);
      request.send(evt.target.result);
    };
    reader.readAsArrayBuffer(this.fileInfo);
    return promise;
  }
  finishUpload() {
    this.ok('Upload completed');
    if (this.guid === 'logo') {
      return serverService.finishLogoUpload(this.studyId, this.revision.createdOn);
    } else {
      return serverService.finishFileRevision(this.guid, this.revision.createdOn);
    }
  }
}
