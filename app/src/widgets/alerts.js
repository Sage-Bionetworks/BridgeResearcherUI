import Swal from "sweetalert2";

const ConfirmToast = Swal.mixin({
  title: "Hey now",
  showCancelButton: true,
  confirmButtonText: "OK",
  confirmButtonColor: "#2185d0"
});
const ConfirmDeleteToast = Swal.mixin({
  title: "Hey now",
  showCancelButton: true,
  allowEscapeKey: true,
  confirmButtonColor: "#db2828"
});
const WarnToast = Swal.mixin({ 
  title: "", 
  type: "warning", 
  confirmButtonText: "OK", 
  confirmButtonColor: "#2185d0" 
});
const promptReply = (value) => {
  if (value === "") {
    Swal.showValidationMessage("Please enter a value");
    return false;
  }
  return value;
};
const PromptToast = Swal.mixin({
  input: "text",
  showCancelButton: true,
  preConfirm: promptReply
});
const NotificationToast = Swal.mixin({
  type: "success"
});

function confirmation(text, func) {
  ConfirmToast.fire({text}).then(result => {
    if (result.value) {
      func();
    }
  });
}
function deleteConfirmation(text, func, confirmButtonText = "Delete") {
  ConfirmDeleteToast.fire({text, confirmButtonText}).then(result => {
    if (result.value) {
      func();
    }
  });
}
function warn(text) {
  WarnToast.fire({text});
}
function prompt(text, okFunc, inputValue = '') {
  PromptToast.fire({text, inputValue}).then(result => {
    if (result.value) {
      okFunc(result.value);
      Swal.close();
    }
  });
}
function notification(title, text) {
  NotificationToast.fire({title, text});
}

export default { confirmation, deleteConfirmation, notification, prompt, warn };
