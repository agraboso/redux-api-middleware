/**
 * Redux middleware for calling an API
 * @module apiMiddleware
 * @requires normalizr
 * @requires isomorphic-fetch
 * @exports {Symbol} CALL_API
 * @exports {function} isRSAA
 * @exports {ReduxMiddleWare} apiMiddleware
 */


import CALL_API from './CALL_API';
import isRSAA from './isRSAA';
import apiMiddleware from './apiMiddleware';

export { CALL_API, isRSAA, apiMiddleware };
