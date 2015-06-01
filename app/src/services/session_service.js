var EventEmitter = require('events');
var $ = require('jquery');

const SESSION_KEY = 'session';
const SESSION_EVENT_KEY = 'session';
var session = null;
var events = new EventEmitter();

$(function() {
    session = localStorage.getItem(SESSION_KEY);
    if (session) {
        events.emit(SESSION_EVENT_KEY, JSON.parse(session));
    } else {
        events.emit(SESSION_EVENT_KEY, null);
    }
});

module.exports = {
    isAuthenticated: function() {
        return (session !== null);
    },
    startSession: function(sess) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
        session = sess;
        events.emit(SESSION_EVENT_KEY, sess);
    },
    endSession: function() {
        localStorage.removeItem(SESSION_KEY);
        session = null;
        events.emit(SESSION_EVENT_KEY, null);
    },
    addListener: function(listener) {
        events.addListener(SESSION_EVENT_KEY, listener);
    },
    removeListener: function(listener) {
        events.removeListener(SESSION_EVENT_KEY, listener);
    }
};