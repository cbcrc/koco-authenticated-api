// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.


// https://github.com/github/fetch

import ko from 'knockout';
import configs from 'koco-configs';
import urlUtilities from 'koco-url-utilities';
import httpUtilities from 'koco-http-utilities';
import AuthenticatedApiEvent from './authenticated-api-event';

const DEFAULT_FETCH_OPTIONS = {
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
  const appUrl = `${window.location.protocol}//${window.location.host}${urlUtilities.url('')}`;
  const returnUrl = `security-authentication-callback?destination=${encodeURIComponent(appUrl)}`;
  return ajaxRedirect.replace(/&wreply=([^&]*)/, `&wreply=$1${encodeURIComponent(returnUrl)}`);
}

function redirectToLogOffPageIfNecessary(response) {
  const ajaxRedirect = response.headers.get('AjaxRedirect');

  if (ajaxRedirect) {
    window.location = getLogOffRedirectLocation(ajaxRedirect);
  }
}

function getFetchOptions(fetchOptions) {
  const combinedOptions = Object.assign({}, fetchOptions, DEFAULT_FETCH_OPTIONS);

  if (fetchOptions && fetchOptions.noCache) {
      combinedOptions.headers.append('pragma', 'no-cache');
      combinedOptions.headers.append('cache-control', 'no-cache');
  }

  return combinedOptions;
}

function getLogInRedirectLocation(ajaxRedirect) {
  const returnUrl = `/api/security-authentication-callback?destination=${encodeURIComponent(window.location.href)}`;
  return ajaxRedirect.replace(/%26ru%3d[^&]*/, `%26ru%3d${encodeURIComponent(returnUrl)}`);
}



function validateIsInitialized(self) {
  if (!self.isInitialized) {
    throw new Error('koco-authenticated-api is not initialized.');
  }
}

function tryGetApiBasePathFromConfigs(apiName) {
  if (!configs || !configs.apis || !configs.apis[apiName]) {
    throw new Error(`no configs for '${apiName}'.`);
  }

  if (!configs.apis[apiName].baseUrl) {
    throw new Error(`no basePath config in configs for '${apiName}'.`);
  }

  return configs.apis[apiName].baseUrl;
}


class AuthenticatedApi {
  constructor(apiName) {
    if (!apiName) {
      throw new Error('apiName parameter is required.');
    }

    this.isInitialized = false;
    this.onRedirectingToLogin = new AuthenticatedApiEvent();
    this.apiName = apiName;
    this.user = ko.observable({
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

  initAsync() {
    if (this.isInitialized) {
      throw new Error('koco-authenticated-api is already initialized.');
    }

    this.isInitialized = true;

    return this.fetch('user-info')
      .then(data => {
        this.user(data);
      });
  }

  fetch(resourceName, options) {
    validateIsInitialized(this);

    return fetch(this.url(resourceName), getFetchOptions(options))
      .then(httpUtilities.checkStatus)
      .then(httpUtilities.parseJSON)
      .catch(ex => this.handle401(ex));
  }

  logOff() {
    return fetch('/api/logoff', getFetchOptions())
      .then(httpUtilities.checkStatus)
      .then(redirectToLogOffPageIfNecessary);
  }

  url(resourceName) {
    validateIsInitialized(this);

    return `${tryGetApiBasePathFromConfigs(this.apiName)}/${resourceName}`;
  }

  handle401(err) {
    return new Promise((resolve, reject) => {
      if (err && err.response && err.response.status === 401) {
        const ajaxRedirect = err.response.headers.get('AjaxRedirect');

        if (ajaxRedirect) {
          this.onRedirectingToLogin.canRedirectToLoginPage()
            .then( /* canRedirectToLoginPage */ () => {
              // if (canRedirectToLoginPage) {
              window.location = getLogInRedirectLocation(ajaxRedirect);
              // }

              reject(err);
            });
        }
      } else {
        reject(err);
      }
    });
  }
}

export default AuthenticatedApi;
