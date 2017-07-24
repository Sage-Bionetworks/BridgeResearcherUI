import EmailViewModel from './email_view_model';

module.exports = class ResetPasswordTemplate extends EmailViewModel {
    constructor() {
        super('resetPasswordTemplate');
    }
};