export default class InputEditor {
  constructor(params) {
    this.obs = params.obs;
    if (typeof params.canEdit === 'boolean') {
      this.canEdit = () => params.canEdit;
    } else {
      this.canEdit = params.canEdit;
    }
    this.placeholder = params.placeholder || '';
    this.formatter = params.formatter || (e => e);
    this.hasFocus = params.hasFocus || false;
  }
}