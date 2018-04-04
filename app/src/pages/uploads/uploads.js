import {serverService} from '../../services/server_service';
import Binder from '../../binder';
import fn from '../../functions';
import tables from '../../tables';
import utils from '../../utils';

const PAGE_SIZE = 50;

module.exports = class UploadsViewModel {
    constructor(params) {
        let {start, end} = fn.getRangeInDays(-14, 0);
        new Binder(this)
            .obs('uploadsStartDate', start)
            .obs('uploadsEndDate', end)
            .obs('find');
        this.loadingFunc = this.loadingFunc.bind(this);
        this.doCalSearch = this.doCalSearch.bind(this);
        
        this.vm = this;
        fn.copyProps(this, fn, 'formatDateTime', 'identity->callback');
        tables.prepareTable(this, {name:'upload'});
    }
    makeSuccess(vm, event) {
        return function(response) {
            event.target.parentNode.parentNode.classList.remove("loading");
        };
    }
    classFor(item) {
        switch(item.status) {
            case 'unknown': return 'negative';
            case 'validation_failed': return 'warning';
            case 'duplicate': return 'warning';
            default: return '';
        }
    }
    iconFor(item) {
        switch(item.status) {
            case 'unknown': return 'help circle icon';
            case 'validation_in_progress': return 'refresh icon';
            case 'validation_failed': return 'ui yellow text warning sign icon';
            case 'duplicate': return 'ui yellow text copy icon';
            case 'succeeded': return 'ui green text checkmark icon';
            default: return '';
        }
    }
    handleKeyEvent(vm, event) {
        if (event.keyCode === 13) {
            utils.clearErrors();
            let id = this.findObs();
            if (!id) {
                return true;
            }
            event.target.parentNode.parentNode.classList.add("loading");
            let success = this.makeSuccess(vm, event);

            utils.startHandler(vm, event);
            serverService.getUploadById(id).then(success).catch(function() {
                serverService.getUploadByRecordId(id).then(success).catch(function(e) {
                    event.target.parentNode.parentNode.classList.remove("loading");
                    utils.failureHandler({transient:false})(e);
                });
            });
        }
        return true;
    }
    dateRange() {
        let start = this.uploadsStartDateObs();
        let end = this.uploadsEndDateObs();
        if (!start || !end) {
            return {start:null, end:null};
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return {start:start.toISOString(), end:end.toISOString()};
    }
    doCalSearch() {
        utils.clearErrors();
        let {start, end} = this.dateRange();
        if (start !== null && end !== null) {
            this.itemsObs([]);
            this.recordsMessageObs("<div class='ui tiny active inline loader'></div>");
            this.callback();
        }
    }
    htmlFor(data) {
        if (data.validationMessageList === undefined) {
            return null;
        }
        return data.validationMessageList.map(function(error) {
            return "<p class='error-message'>"+error+"</p>";
        }).join('');
    }
    toggle(item) {
        item.collapsedObs(!item.collapsedObs());
    }
    processItem(item) {
        new Binder(item)
            .obs('content','')
            .obs('href','')
            .obs('collapsed', true)
            .obs('completedBy', '');
            
        if (item.status === 'succeeded') {
            let id = item.schemaId;
            let rev = item.schemaRevision;
            item.contentObs(id);
            item.hrefObs('/#/schemas/'+encodeURIComponent(id)+'/versions/'+rev+'/editor');
        }
        item.progressState = this.uploadProgressBarState(item);
        item.requestedOn = fn.formatDateTime(item.requestedOn);
        item.completedByObs(this.uploadFormatCompletedBy(item));
    }
    uploadFormatCompletedBy(item) {
        if (item.status === 'succeeded') {
            let start = new Date(item.requestedOn).getTime();
            let end = new Date(item.completedOn).getTime();
            let fStart = fn.formatDateTime(item.requestedOn);
            let fEnd = fn.formatDateTime(item.completedOn);
            if (fStart.split(', ')[0] === fEnd.split(', ')[0]) {
                fEnd = fEnd.split(', ')[1];
            }
            return fEnd+" ("+item.completedBy+", "+fn.formatMs(end-start)+")";
        } else if (item.status === 'duplicate') {
            return "duplicates <span class='upload-id'>"+item.duplicateUploadId+"</span>";
        }
        return '';
    }
    uploadProgressBarState(item) {
        let obj = {type: 'progress', color: 'gray', value: 1, label: 'Upload Requested', total:3};
        if (item.status === 'succeeded') {
            obj.value = 2;
            obj.label = "Upload Completed";
            if (item.healthRecordExporterStatus === 'succeeded') {
                obj.value = 3;  
                obj.label = "Export Completed";
                obj.color = "green";
            } else if (typeof item.healthRecordExporterStatus === 'undefined') {
                obj.color = "green";
            }
        } else if (item.status === 'duplicate') {
            obj.value = 2;
            obj.label = "Upload Error";
        }
        return obj;
    }
    processUploads(response) {
        if (response.items) {
            response.items.map(this.processItem.bind(this));
            this.itemsObs(response.items);
        }
        return response;
    }
    loadingFunc(args) {
        args = args || {};
        args.pageSize = PAGE_SIZE;
        let {start, end} = this.dateRange();
        args.startTime = start;
        args.endTime = end;
        return serverService.getUploads(args)
            .then(this.processUploads.bind(this))
            .catch(utils.failureHandler());
    }
};
