import alerts from "./widgets/alerts";
import Binder from "./binder";
import $ from 'jquery';
import ko from "knockout";
import serverService from "./services/server_service";
import toastr from 'toastr';

function roleFunc(observer, role) {
  return ko.computed(function() {
    return observer().indexOf(role) > -1;
  });
}
function checkVerifyStatus() {
  serverService.emailStatus().then(unverifiedEmailAlert);
}
function unverifiedEmailAlert(response) {
  if (response.status !== "verified") {
    alerts.warn(
      "To send email, the owner of your support email address\n" +
        "must verify the address.\n\n" +
        "See under Settings > Email to resend a request.\n\n" +
        "You will not be able to send email until this step is completed."
    );
  }
}

let RootViewModel = function() {
  let self = this;

  new Binder(self)
    .obs("environment", "")
    .obs("appName", "")
    .obs("appId")
    .obs("selected", "")
    .obs("roles[]", [])
    .obs("mainPage", "empty")
    .obs("mainParams", {})
    .obs("editorPanel", "none")
    .obs("editorParams", {})
    .obs("isEditorTabVisible", false)
    .obs("notificationsEnabled", false)
    .obs("appMemberships[]")
    .obs("sidePanel", "navigation")
    .obs("dialog", { name: "none" });

  self.mainPageObs.subscribe(self.selectedObs);
  self.mainPageObs.subscribe(() => self.setEditorPanel("none", {}));
  self.showNav = () => $('#sidebar').sidebar('toggle');
  
  self.setEditorPanel = function(name, params) {
    self.editorPanelObs(name);
    self.editorParamsObs(params);
    self.isEditorTabVisibleObs(name !== "none");
    self.sidePanelObs("editor");
  };
  self.setSidebarPanel = function(vm, event) {
    if (event.target.nodeName === "A") {
      self.sidePanelObs(event.target.textContent.toLowerCase());
    }
  };
  self.isSidebarActive = function(tag) {
    return self.sidePanelObs() === tag;
  };
  self.signOut = function() {
    serverService.signOut();
  };
  self.settings = function() {
    self.openDialog("settings");
  };
  self.changeView = function(name, params) {
    self.isEditorTabVisibleObs(false);
    self.sidePanelObs("navigation");
    self.mainPageObs(name);
    self.mainParamsObs(params);
  };

  self.isResearcher = roleFunc(self.rolesObs, "researcher");
  self.isDeveloper = roleFunc(self.rolesObs, "developer");
  self.isAdmin = roleFunc(self.rolesObs, "admin");
  self.isSuperadmin = roleFunc(self.rolesObs, "superadmin");
  self.isSharedApp = ko.computed(function() {
    return self.appIdObs() === "shared";
  });
  self.isResearcherOnly = ko.computed(function() {
    let roles = self.rolesObs();
    return roles.indexOf("researcher") > -1 && roles.indexOf("developer") === -1;
  });

  self.openDialog = function(dialogName, params) {
    self.dialogObs({ name: dialogName, params: params });
  };
  self.closeDialog = function() {
    self.dialogObs({ name: "none" });
  };
  self.isDevEnvObs = ko.computed(function() {
    return ["local", "develop", "staging"].indexOf(self.environmentObs()) > -1;
  });
  self.changeApp = function(appId) {
    $('#sidebar').sidebar('toggle');
    document.body.style.opacity = 0.0;
    setTimeout(() => {
      serverService.changeApp(appId.name, appId.identifier)
        .then(() => document.location.reload())
        .catch(() => {
          document.body.style.opacity = 1.0;
          setTimeout(() => toastr.error('Could not switch apps.'), 500);
        });
    }, 500);
  };
  serverService.addSessionStartListener(function(session) {
    self.appNameObs(session.appName);
    self.environmentObs(session.environment);
    self.appIdObs(session.appId);
    self.rolesObs(session.roles);

    serverService.getApp().then(function(app) {
      self.notificationsEnabledObs(Object.keys(app.pushNotificationARNs).length > 0);
    });
    serverService.getAppMemberships()
        .then((response) => self.appMembershipsObs(response.items));
  });
  serverService.addSessionEndListener(function() {
    self.appNameObs("");
    self.environmentObs("");
    self.appIdObs("");
    self.rolesObs([]);
    self.openDialog("sign_in_dialog", { closeable: false });
  });
  if (self.isDeveloper()) {
    setTimeout(checkVerifyStatus, 1000);
  }
};

let root = new RootViewModel();

root.queryParams = {};
let params = new URLSearchParams(document.location.search);
// eventually, will use Object.fromEntries (not supported in Edge yet)
for (let p of params.keys()) {
  root.queryParams[p] = params.get(p);
}
root.queryParams.appPath = document.location.pathname.substring(1);
console.debug("root.queryParams", root.queryParams);

export default root;

window.addEventListener("DOMContentLoaded", function() {
  ko.applyBindings(root, document.documentElement);
  document.body.style.opacity = "1.0";
  serverService.initSession();

  $('#sidebar').sidebar();

}, false);
