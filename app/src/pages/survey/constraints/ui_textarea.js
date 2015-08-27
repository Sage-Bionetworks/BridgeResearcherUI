var ko = require('knockout');

ko.bindingHandlers.resizeTextArea = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var textareaSize = element.querySelector('.textarea-size');
        var textarea = element.querySelector('textarea');
        var autoSize = function () {
            textareaSize.innerHTML = textarea.value.trim() + '\n';
        };
        textarea.addEventListener('input', autoSize, false);
        setTimeout(autoSize, 200);
    }
};

/**
 * Create an auto-resizing textarea control without going insane.
 *
 * http://www.brianchu.com/blog/2013/11/02/creating-an-auto-growing-text-input/
 *
 * @param params
 */
module.exports = function(params) {
    var self = this;

    self.fieldObs = params.fieldObs;
    self.publishedObs = params.publishedObs;
    self.className = params.className;
    self.placeholder = params.placeholder;
};