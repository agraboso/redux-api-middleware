import { normalize } from 'normalizr';
import fetch from 'isomorphic-fetch';
import ApiError from './ApiError';

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
      if (response.ok) {
        return Promise.resolve(response);
      } else {
        return Promise.reject(response);
      }
    })
    .then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && ~contentType.indexOf('json')) {
        return response.json().then((json) => {
          if (schema) {
            return Promise.resolve(normalize(json, schema));
          } else {
            return Promise.resolve(json);
          }
        });
      } else {
        return Promise.resolve();
      }
    },
    (response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && ~contentType.indexOf('json')) {
        return response.json().then((json) => {
          return Promise.reject(new ApiError(response.status, response.statusText, json));
        });
      } else {
        return Promise.reject(new ApiError(response.status, response.statusText, response));
      }
    });
}

export default callApi;
