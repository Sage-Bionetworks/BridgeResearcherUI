var swal = require('sweetalert');
require('../../../node_modules/sweetalert/dist/sweetalert.css');

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

module.exports = {
    confirmation: confirmation,
    deleteConfirmation: deleteConfirmation
};