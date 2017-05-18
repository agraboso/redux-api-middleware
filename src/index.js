/**
 * Redux middleware for calling an API
 * @module redux-api-middleware
 * @requires isomorphic-fetch
 * @requires lodash.isplainobject
 * @exports {string} RSAA
 * @exports {string} CALL_API - alias of RSAA, to be deprecated in v3
 * @exports {function} isRSAA
 * @exports {function} validateRSAA
 * @exports {function} isValidRSAA
 * @exports {error} InvalidRSAA
 * @exports {error} InternalError
 * @exports {error} RequestError
 * @exports {error} ApiError
 * @exports {function} getJSON
 * @exports {ReduxMiddleWare} apiMiddleware
 */

/**
 * @typedef {function} ReduxMiddleware
 * @param {object} store
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

import RSAA from './RSAA';
import { isRSAA, validateRSAA, isValidRSAA } from './validation';
import { InvalidRSAA, InternalError, RequestError, ApiError } from './errors';
import { getJSON } from './util';
import { apiMiddleware } from './middleware';

export {
  // Alias RSAA to CALL_API to smooth v1 - v2 migration
  // TODO: Deprecate in v3
  RSAA as CALL_API,

  RSAA,
  isRSAA,
  validateRSAA,
  isValidRSAA,
  InvalidRSAA,
  InternalError,
  RequestError,
  ApiError,
  getJSON,
  apiMiddleware
};
