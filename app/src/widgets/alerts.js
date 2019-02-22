import swal from "sweetalert2";

function confirmation(message, func) {
  swal({
    title: "Hey now",
    text: message,
    showCancelButton: true,
    confirmButtonText: "OK",
    confirmButtonColor: "#2185d0"
  }).then(result => {
    if (result.value) {
      func();
    }
  });
}
function deleteConfirmation(message, func, deleteButton) {
  swal({
    title: "Hey now",
    text: message,
    showCancelButton: true,
    allowEscapeKey: true,
    confirmButtonColor: "#db2828",
    confirmButtonText: deleteButton || "Delete"
  }).then(result => {
    if (result.value) {
      func();
    }
  });
}
function warn(message) {
  swal({ title: "", text: message, type: "warning", confirmButtonText: "OK", confirmButtonColor: "#2185d0" });
}
function prompt(message, okFunc) {
  swal({
    text: message,
    input: "text",
    showCancelButton: true,
    preConfirm: value => {
      if (value === "") {
        swal.showValidationError("Please enter a value");
        return false;
      }
      return value;
    }
  }).then(result => {
    if (result.value) {
      okFunc(result.value);
      swal.close();
    }
  });
}
function notification(title, message) {
  swal({ title: title, text: message, type: "success" });
}

export default {
  confirmation,
  deleteConfirmation,
  notification,
  prompt,
  warn
};
