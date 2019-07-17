// import swal from "sweetalert2";
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
const PromptToast = Swal.mixin({
  input: "text",
  showCancelButton: true,
  preConfirm: value => {
    if (value === "") {
      swal.showValidationError("Please enter a value");
      return false;
    }
    return value;
  }  
});
const NotificationToast = Swal.mixin({
  type: "success"
});

function confirmation(message, func) {
  ConfirmToast.fire({
    text: message,
  }).then(result => {
    if (result.value) {
      func();
    }
  });
}
function deleteConfirmation(message, func, deleteButton) {
  ConfirmDeleteToast.fire({
    text: message,
    confirmButtonText: deleteButton || "Delete"
  }).then(result => {
    if (result.value) {
      func();
    }
  });
}
function warn(message) {
  WarnToast.fire({
    text: message
  });
}
function prompt(message, okFunc) {
  PromptToast.fire({
    text: message
  }).then(result => {
    if (result.value) {
      okFunc(result.value);
      swal.close();
    }
  });
}
function notification(title, message) {
  NotificationToast.fire({
    title: title,
    text: message
  });
}

export default {
  confirmation,
  deleteConfirmation,
  notification,
  prompt,
  warn
};
