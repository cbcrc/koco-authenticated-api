(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'knockout', 'koco-configs', 'koco-url-utilities', 'koco-http-utilities'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('knockout'), require('koco-configs'), require('koco-url-utilities'), require('koco-http-utilities'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.knockout, global.kocoConfigs, global.kocoUrlUtilities, global.kocoHttpUtilities);
    global.authenticatedApi = mod.exports;
  }
})(this, function (exports, _knockout, _kocoConfigs, _kocoUrlUtilities, _kocoHttpUtilities) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _knockout2 = _interopRequireDefault(_knockout);

  var _kocoConfigs2 = _interopRequireDefault(_kocoConfigs);

  var _kocoUrlUtilities2 = _interopRequireDefault(_kocoUrlUtilities);

  var _kocoHttpUtilities2 = _interopRequireDefault(_kocoHttpUtilities);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var DEFAULT_FETCH_OPTIONS = {
    credentials: 'include',
    mode: 'cors', // TODO:  settings cors oui ou non
    redirect: 'follow',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    })
  };

  function getLogOffRedirectLocation(ajaxRedirect) {
    var appUrl = window.location.protocol + '//' + window.location.host + _kocoUrlUtilities2.default.url('');
    var returnUrl = 'security-authentication-callback?destination=' + encodeURIComponent(appUrl);
    return ajaxRedirect.replace(/&wreply=([^&]*)/, '&wreply=$1' + encodeURIComponent(returnUrl));
  }

  function redirectToLogOffPageIfNecessary(response) {
    var ajaxRedirect = response.headers.get('AjaxRedirect');

    if (ajaxRedirect) {
      window.location = getLogOffRedirectLocation(ajaxRedirect);
    }
  }

  function getFetchOptions(fetchOptions) {
    return Object.assign({}, fetchOptions, DEFAULT_FETCH_OPTIONS);
  }

  function getLogInRedirectLocation(ajaxRedirect) {
    var returnUrl = '/api/security-authentication-callback?destination=' + encodeURIComponent(window.location.href);
    return ajaxRedirect.replace(/%26ru%3d[^&]*/, '%26ru%3d' + encodeURIComponent(returnUrl));
  }

  function redirectToLogInPageIfNecessary(response) {
    var ajaxRedirect = response.headers.get('AjaxRedirect');

    if (ajaxRedirect) {
      window.location = getLogInRedirectLocation(ajaxRedirect);
    }
  }

  function handle401(response) {
    if (response.status === 401) {
      redirectToLogInPageIfNecessary(response);
    }

    return response;
  }

  function validateIsInitialized(self) {
    if (!self.isInitialized) {
      throw new Error('koco-authenticated-api is not initialized.');
    }
  }

  function tryGetApiBasePathFromConfigs(apiName) {
    if (!_kocoConfigs2.default || !_kocoConfigs2.default.apis || !_kocoConfigs2.default.apis[apiName]) {
      throw new Error('no configs for \'' + apiName + '\'.');
    }

    if (!_kocoConfigs2.default.apis[apiName].baseUrl) {
      throw new Error('no basePath config in configs for \'' + apiName + '\'.');
    }

    return _kocoConfigs2.default.apis[apiName].baseUrl;
  }

  var AuthenticatedApi = function () {
    function AuthenticatedApi(apiName) {
      _classCallCheck(this, AuthenticatedApi);

      if (!apiName) {
        throw new Error('apiName parameter is required.');
      }

      this.isInitialized = false;
      this.apiName = apiName;
      this.user = _knockout2.default.observable({
        isAuthenticated: false,
        userName: '',
        groups: [],
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        fullName: ''
      });
    }

    _createClass(AuthenticatedApi, [{
      key: 'initAsync',
      value: function initAsync() {
        var _this = this;

        if (this.isInitialized) {
          throw new Error('koco-authenticated-api is already initialized.');
        }

        this.isInitialized = true;

        return this.fetch('user-info').then(function (data) {
          _this.user(data);
        });
      }
    }, {
      key: 'fetch',
      value: function (_fetch) {
        function fetch(_x, _x2) {
          return _fetch.apply(this, arguments);
        }

        fetch.toString = function () {
          return _fetch.toString();
        };

        return fetch;
      }(function (resourceName, options) {
        validateIsInitialized(this);

        return fetch(this.url(resourceName), getFetchOptions(options)).then(handle401).then(_kocoHttpUtilities2.default.checkStatus).then(_kocoHttpUtilities2.default.parseJSON);
      })
    }, {
      key: 'logOff',
      value: function logOff() {
        return fetch('/api/logoff').then(_kocoHttpUtilities2.default.checkStatus).then(redirectToLogOffPageIfNecessary);
      }
    }, {
      key: 'url',
      value: function url(resourceName) {
        validateIsInitialized(this);

        return tryGetApiBasePathFromConfigs(this.apiName) + '/' + resourceName;
      }
    }]);

    return AuthenticatedApi;
  }();

  exports.default = AuthenticatedApi;
});