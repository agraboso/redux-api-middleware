/**
 * Redux middleware for calling an API
 * @module apiMiddleware
 * @requires normalizr
 * @requires isomorphic-fetch
 * @exports {Symbol} CALL_API
 * @exports {ReduxMiddleWare} apiMiddleware
 */

/**
 * @typedef {function} ReduxMiddleware
 * @param {Object} store
 * @returns {ReduxNextHandler}
 *
 * @typedef {function} ReduxNextHandler
 * @param {function} next
 * @returns {ReduxActionHandler}
 *
 * @typedef {function} ReduxActionHandler
 * @param {object} action
 * @returns undefined
 */

import { normalize, Schema } from 'normalizr';
import fetch from 'isomorphic-fetch';
import isPlainObject from 'lodash.isplainobject';

/**
 * Fetches an API response and normalizes the resulting JSON according to schema.
 *
 * @function callApi
 * @access private
 * @param {string} endpoint - The URL endpoint for the request
 * @param {string} method - The HTTP method for the request
 * @param {boolean} [auth=false] - Whether to send authentication credentials or not
 * @param {Object} [body] - The body of the request
 * @param {Schema} [schema] - The normalizr schema with which to parse the response
 * @returns {Promise}
 */
function callApi(endpoint, method, headers, body, schema) {
  const requestOptions = { method, body, headers }

  return fetch(endpoint, requestOptions)
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(new Error(`${response.status} - ${response.statusText}`));
      }
    })
    .then(response => response.json())
    .then((json) => {
      if (schema) {
        return Promise.resolve(normalize(json, schema));
      } else {
        return Promise.resolve(json);
      }
    });
}

/**
 * Action key that carries API call info interpreted by this Redux middleware.
 *
 * @constant {Symbol}
 * @access public
 * @default
 */
export const CALL_API = Symbol('Call API');

/**
 * Is the given action a Redux Standard API-calling action?
 *
 * @function isRSAA
 * @access public
 * @param action - The action to check against the RSAA definition.
 * @returns {boolean}
 */
export function isRSAA(action) {
  const validRootKeys = [
    [CALL_API],
    'payload',
    'meta'
  ];
  const validCallAPIKeys = [
    'endpoint',
    'method',
    'types',
    'body',
    'headers',
    'schema',
    'bailout'
  ];

  const callAPI = action[CALL_API];
  if (!isPlainObject(action) || typeof callAPI === 'undefined') {
    return false;
  }

  const { endpoint, method, body, headers, schema, types, bailout } = callAPI;

  return Object.keys(action).every(key => ~validRootKeys.indexOf(key)) &&
    isPlainObject(callAPI) &&
    Object.keys(callAPI).every(key => ~validCallAPIKeys.indexOf(key)) &&
    (typeof endpoint === 'string' || typeof endpoint === 'function') &&
    ~['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) &&
    (Array.isArray(types) && types.length === 3) &&
    (typeof body === 'undefined' || isPlainObject(body)) &&
    (typeof headers === 'undefined' || isPlainObject(headers)) &&
    (typeof schema === 'undefined' || schema instanceof Schema) &&
    (typeof bailout === 'undefined' || typeof bailout === 'boolean' || typeof bailout === 'function');
}

/**
 * A Redux middleware that interprets actions with CALL_API info specified.
 * Performs the call and promises when such actions are dispatched.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
export function apiMiddleware({ getState }) {
  return next => action => {
    const callAPI = action[CALL_API];
    if (!isRSAA(action)) {
      return next(action);
    }

    let { endpoint } = callAPI;
    const { method, body, headers, schema, types, bailout } = callAPI;
    if (typeof endpoint === 'function') {
      endpoint = endpoint(getState());
    }
    if (bailout && bailout(getState())) {
      return Promise.resolve();
    }

    function actionWith(data, payload) {
      const finalPayload = { ...action.payload, ...payload };
      const finalAction = { ...action, payload: finalPayload, ...data };
      delete finalAction[CALL_API];
      return finalAction;
    }

    const [requestType, successType, failureType] = types;
    next(actionWith({ type: requestType }));

    return callApi(endpoint, method, headers, body, schema).then(
      response => next(actionWith({ type: successType }, response)),
      error => next(actionWith({
        type: failureType,
        payload: error,
        error: true
      }))
    );
  };
}
