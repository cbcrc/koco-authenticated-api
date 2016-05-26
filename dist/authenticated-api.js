'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _kocoApiUtilities = require('koco-api-utilities');

var _kocoApiUtilities2 = _interopRequireDefault(_kocoApiUtilities);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _kocoUrlUtilities = require('koco-url-utilities');

var _kocoUrlUtilities2 = _interopRequireDefault(_kocoUrlUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function AuthenticatedApi(apiName) {
    var self = this;

    self.apiName = apiName;
    self.user = _knockout2.default.observable({
        isAuthenticated: false,
        userName: '',
        groups: [],
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        fullName: ''
    });
} // Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

AuthenticatedApi.prototype.init = function () {
    var self = this;

    if (self.isInitialized) {
        throw new Error('koco-authenticated-api - already initialized');
    }

    self.isInitialized = true;

    return new _jquery2.default.Deferred(function (dfd) {
        try {
            var ajaxOptions = {
                dataType: 'json',
                url: self.url('user-info')
            };

            _jquery2.default.ajax(getAjaxOptions(self, ajaxOptions)).done(function (user) {
                self.user(user);
                dfd.resolve();
            }).fail(function (jqxhr, textStatus, error) {
                dfd.reject('koco-authenticated-api - the call to \'user-info\' resource of authenticated api failed.', jqxhr, textStatus, error);
            });
        } catch (err) {
            dfd.reject(err);
        }
    }).promise();
};

AuthenticatedApi.prototype.getJson = function (resourceName, ajaxOptionsOrSuccess, ajaxOptions) {
    var self = this;

    validateIsInitialized(self);
    ajaxOptions = ajaxOptions || {};
    ajaxOptionsOrSuccess = ajaxOptionsOrSuccess || {};

    if (_lodash2.default.isFunction(ajaxOptionsOrSuccess)) {
        return _kocoApiUtilities2.default.getJson(self.apiName, resourceName, ajaxOptionsOrSuccess, getAjaxOptions(self, ajaxOptions));
    } else {
        return _kocoApiUtilities2.default.getJson(self.apiName, resourceName, getAjaxOptions(self, ajaxOptionsOrSuccess));
    }
};

AuthenticatedApi.prototype.postJson = function (resourceName, data, ajaxOptions) {
    var self = this;

    validateIsInitialized(self);
    return _kocoApiUtilities2.default.postJson(self.apiName, resourceName, data, getAjaxOptions(self, ajaxOptions));
};

AuthenticatedApi.prototype.putJson = function (resourceName, data, ajaxOptions) {
    var self = this;

    validateIsInitialized(self);
    return _kocoApiUtilities2.default.putJson(self.apiName, resourceName, data, getAjaxOptions(self, ajaxOptions));
};

AuthenticatedApi.prototype.delete = function (resourceName, ajaxOptions) {
    var self = this;

    validateIsInitialized(self);
    return _kocoApiUtilities2.default.delete(self.apiName, resourceName, getAjaxOptions(self, ajaxOptions));
};

AuthenticatedApi.prototype.url = function (resourceName) {
    var self = this;

    validateIsInitialized(self);
    return _kocoApiUtilities2.default.url(self.apiName, resourceName);
};

AuthenticatedApi.prototype.logOff = function () {
    var request = _jquery2.default.ajax('/api/logoff').done(function (data, textStatus, jqXhr) {
        var ajaxRedirect = jqXhr.getResponseHeader('AjaxRedirect');
        if (ajaxRedirect) {
            var appUrl = window.location.protocol + '//' + window.location.host + _kocoUrlUtilities2.default.url('');
            var returnUrl = 'security-authentication-callback?destination=' + encodeURIComponent(appUrl);
            window.location = ajaxRedirect.replace(/&wreply=([^&]*)/, '&wreply=$1' + encodeURIComponent(returnUrl));
        }
    });

    return request;
};

function getAjaxOptions(self, ajaxOptions) {
    var options = _jquery2.default.extend({}, ajaxOptions);

    if (!options.error) {
        options.error = handle401;
    } else if (Array.isArray(options.error)) {
        options.error.unshift(handle401);
    } else {
        options.error = [handle401, options.error];
    }

    //TODO: Seulement si CORS configuré
    options.xhrFields = {
        withCredentials: true
    };
    options.headers = {
        'X-Requested-With': 'XMLHttpRequest'
    };

    return options;
}

function handle401(jqXhr) {
    if (jqXhr.status !== 401) {
        return;
    }

    var ajaxRedirect = jqXhr.getResponseHeader('AjaxRedirect');
    if (ajaxRedirect) {
        var returnUrl = '/api/security-authentication-callback?destination=' + encodeURIComponent(window.location.href);
        window.location = ajaxRedirect.replace(/%26ru%3d[^&]*/, '%26ru%3d' + encodeURIComponent(returnUrl));
    }
}

function validateIsInitialized(self) {
    if (!self.isInitialized) {
        throw new Error('koco-authenticated-api - not initialized');
    }
}

exports.default = AuthenticatedApi;