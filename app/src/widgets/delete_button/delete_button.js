import ko from "knockout";

export default function(params) {
  let self = this;

  self.canDelete = params.canDelete || ko.observable(true);
  self.canDeletePermanently = params.canDeletePermanently || ko.observable(true);

  self.disabledObs = params.disabled;
  self.deleteFunc = (item) => params.delete(item);
  self.deletePermanentlyFunc = (item) => params.deletePermanently(item);
}
