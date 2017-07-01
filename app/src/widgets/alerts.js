import '../../../node_modules/sweetalert/dist/sweetalert.css';
import { swal } from 'sweetalert';

function confirmation(message, func) {
    swal({ title: "Hey now", text: message, showCancelButton: true,
        confirmButtonText: "OK", confirmButtonColor: "#2185d0",
    }, function(isConfirm){
        if (isConfirm) { func(); }
    });
}
function deleteConfirmation(message, func, deleteButton) {
    swal({ title: "Hey now", text: message, showCancelButton: true,
        allowEscapeKey: true, confirmButtonColor: "#db2828", 
        confirmButtonText: deleteButton || "Delete"
    }, function(isConfirm){
        if (isConfirm) { func(); }
    });
}
function warn(message) {
    swal({ title: "", text: message, type: "warning", confirmButtonText: "OK", confirmButtonColor: "#2185d0"});
}
function prompt(message, okFunc) {
    swal({title: "", text: message, type: "input", showCancelButton: true, closeOnConfirm: false}, function(inputValue) {
        if (inputValue === false) {
            return false;
        }
        if (inputValue === "") {
            swal.showInputError("Please enter a value");
            return false;
        }
        okFunc(inputValue);
        swal.close();
    });
}

export default {
    warn,
    confirmation,
    deleteConfirmation,
    prompt
};