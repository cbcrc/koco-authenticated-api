// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.


// https://github.com/github/fetch

import ko from 'knockout';
import configs from 'koco-configs';
import urlUtilities from 'koco-url-utilities';
import httpUtilities from 'koco-http-utilities';

const DEFAULT_FETCH_OPTIONS = {
  credentials: 'include',
  mode: 'cors', // TODO:  settings cors oui ou non
  redirect: 'follow',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
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
  return Object.assign({}, fetchOptions, DEFAULT_FETCH_OPTIONS);
}

function getLogInRedirectLocation(ajaxRedirect) {
  const returnUrl = `/api/security-authentication-callback?destination=${encodeURIComponent(window.location.href)}`;
  return ajaxRedirect.replace(/%26ru%3d[^&]*/, `%26ru%3d${encodeURIComponent(returnUrl)}`);
}

function redirectToLogInPageIfNecessary(response) {
  const ajaxRedirect = response.headers.get('AjaxRedirect');

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
      .then(handle401)
      .then(httpUtilities.checkStatus)
      .then(httpUtilities.parseJSON);
  }

  logOff() {
    return fetch('/api/logoff')
      .then(httpUtilities.checkStatus)
      .then(redirectToLogOffPageIfNecessary);
  }

  url(resourceName) {
    validateIsInitialized(this);

    return `${tryGetApiBasePathFromConfigs(this.apiName)}/${resourceName}`;
  }
}

export default AuthenticatedApi;
