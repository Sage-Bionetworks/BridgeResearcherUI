import EmailViewModel from './email_view_model';

module.exports = class AccountExistsTemplate extends EmailViewModel {
    constructor() {
        super('accountExistsTemplate');
    }
};