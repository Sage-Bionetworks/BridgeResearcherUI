'use strict';
var ko = require('knockout');
var serverService = require('../../services/server_service');
var schemaUtils = require('../schema/schema_utils');
var utils = require('../../utils');
var dragula = require('dragula');

/**
 * You can edit the name and the fields in an upload schema.
 * @param params
 */
module.exports = function(params) {
    var self = this;

    schemaUtils.initVM(self);
    self.schemaIdObs = ko.observable(params.schemaId);
    self.revisionObs = ko.observable(params.revision);
    self.schemaTypeObs = ko.observable("");

    self.nameObs = ko.observable("");
    self.itemsObs = ko.observableArray([]);
    // We call "published" any schema that is loaded with a specific revision,
    // except for the most recent one, which we load by the way we link to the
    // editor.
    self.publishedObs = ko.observable(false);
    self.revisionLabel = ko.computed(function() {
        if (self.revisionObs()) {
            return 'v' + self.revisionObs();
        }
        return '';
    });

    function loadVM(schema) {
        self.schema = schema;
        self.schemaTypeObs(schema.schemaType);
        self.schemaIdObs(schema.schemaId);
        self.nameObs(schema.name);
        self.revisionObs(schema.revision);
        self.itemsObs(schema.fieldDefinitions.map(function(def) {
            def.nameObs = ko.observable(def.name);
            def.requiredObs = ko.observable(def.required);
            def.typeObs = ko.observable(def.type);
            return def;
        }));
        return schema;
    }

    self.save = function(vm, event) {
        utils.startHandler(vm, event);
        self.schema.name = self.nameObs();
        self.schema.schemaId = self.schemaIdObs();
        self.schema.revision = self.revisionObs();
        self.schema.schemaType = self.schemaTypeObs();
        self.schema.fieldDefinitions = self.itemsObs().map(function(item) {
            return {
                name: item.nameObs(),
                required: item.requiredObs(),
                type: item.typeObs()
            };
        });
        serverService.updateUploadSchema(self.schema)
            .then(utils.successHandler(vm, event, "Schema has been saved."))
            .then(function(response) {
                self.revisionObs(response.revision);
            })
            .catch(utils.failureHandler(vm, event));
    };
    self.addBelow = function(vm, event) {
        var index = self.itemsObs.indexOf(vm.field);
        var field = schemaUtils.newField();
        self.itemsObs.splice(index+1,0,field);
    };
    self.addFirst = function(vm, event) {
        var field = schemaUtils.newField();
        self.itemsObs.push(field);
    };

    if (params.schemaId === "new") {
        loadVM({name:'',schemaId:'',schemaType:'ios_data',revision:0,fieldDefinitions:[]});
    } else if (params.revision) {
        serverService.getMostRecentUploadSchema(params.schemaId).then(function(response) {
            serverService.getUploadSchema(params.schemaId, params.revision).then(loadVM).then(function() {
                self.revisionObs(response.revision);
            });
        });
    } else {
        serverService.getMostRecentUploadSchema(params.schemaId).then(loadVM);
    }

    var elementsZoneEl = document.querySelector(".sfieldZone");
    if (!self.publishedObs()) {
        var _item = null;

        dragula([elementsZoneEl], {
            moves: function (el, container, handle) {
                return (handle.className === 'sfield-draghandle');
            }
        }).on('drop', function(el, zone) {
            var elements = document.querySelectorAll(".sfieldZone .sfield");
            // This utility handles node lists
            var index = ko.utils.arrayIndexOf(elements, el);
            var data = ko.contextFor(el).$data;
            self.itemsObs.remove(data);
            self.itemsObs.splice(index,0,data);
            if (_item) {
                _item.parentNode.removeChild(_item);
                _item = null;
            }
        }).on('cloned', function(mirror, item, type) {
            _item = item;
        });
    }
};
