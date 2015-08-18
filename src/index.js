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
    .then(response =>
      response.json().then(json => ({ json, response }))
    ).then(({ json, response }) => {
      if (!response.ok) {
        return Promise.reject(json);
      }
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
  if (!isPlainObject(action)) {
    return false;
  }

  const callAPI = action[CALL_API];
  if (typeof callAPI === 'undefined') {
    return false;
  }

  let { endpoint } = callAPI;
  const { method, body, headers, schema, types, bailout } = callAPI;

  if (typeof endpoint !== 'string' && typeof endpoint !== 'function') {
    return false;
  }
  if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) === -1) {
    return false;
  }
  if (typeof body !== 'undefined' && isPlainObject(body)) {
    return false;
  }
  if (typeof headers !== 'undefined' && isPlainObject(headers)) {
    return false;
  }
  if (typeof schema !== 'undefined' && !(schema instanceof Schema)) {
    return false;
  }
  if (!Array.isArray(types) || types.length !== 3) {
    return false;
  }
  if (!types.every(type => (typeof type === 'string' || typeof type === 'symbol'))) {
    return false;
  }
  if (typeof bailout !== 'undefined' && typeof bailout !== 'function') {
    throw new Error('Expected bailout to either be undefined or a function.');
  }

  return true;
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
      const finalAction = { ...action, payload: finalPayload };
      delete finalAction[CALL_API];
      return finalAction;
    }

    const [requestType, successType, failureType] = types;
    next(actionWith({ type: requestType }));

    return callApi(endpoint, method, headers, body, schema).then(
      response => next(actionWith({
        type: successType
      }, {
        payload: response
      })),
      error => next(actionWith({
        type: failureType,
        payload: error.message || 'Something bad happened',
        error: true
      }))
    );
  };
}
