import CALL_API from './CALL_API';
import { normalize, Schema } from 'normalizr';
import isPlainObject from 'lodash.isplainobject';

/**
 * Is the given action a Redux Standard API-calling action?
 *
 * @function isRSAA
 * @access public
 * @param {Object} action - The action to check against the RSAA definition.
 * @returns {boolean}
 */
function isRSAA(action) {
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
  const validMethods = [
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ]

  const callAPI = action[CALL_API];
  if (!isPlainObject(action) || typeof callAPI === 'undefined') {
    return false;
  }

  const { endpoint, method, body, headers, schema, types, bailout } = callAPI;

  return Object.keys(action).every((key) => ~validRootKeys.indexOf(key)) &&
    isPlainObject(callAPI) &&
    Object.keys(callAPI).every((key) => ~validCallAPIKeys.indexOf(key)) &&
    (typeof endpoint === 'string' || typeof endpoint === 'function') &&
    ~validMethods.indexOf(method.toUpperCase()) &&
    (Array.isArray(types) && types.length === 3) &&
    (typeof headers === 'undefined' || isPlainObject(headers)) &&
    (typeof schema === 'undefined' || schema instanceof Schema || schema.hasOwnProperty('_itemSchema')) &&
    (typeof bailout === 'undefined' || typeof bailout === 'boolean' || typeof bailout === 'function');
}

export default isRSAA;
