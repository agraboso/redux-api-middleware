import CALL_API from './CALL_API';
import isPlainObject from 'lodash.isplainobject';

/**
 * Checks an action against the RSAA definition, returning a (possibly empty)
 * array of validation errors.
 *
 * @function validateRSAA
 * @access public
 * @param {Object} action - The action to check against the RSAA definition.
 * @returns {Array}
 */
function validateRSAA(action) {
  var validationErrors = [];
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
    'transform',
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

  if (!isPlainObject(action)) {
    validationErrors.push('RSAA must be a plain JavaScript object');
    return validationErrors;
  }

  const callAPI = action[CALL_API];
  if (typeof callAPI === 'undefined') {
    validationErrors.push('Missing [CALL_API] key');
    return validationErrors;
  }
  for (let key in action) {
    if (!validRootKeys.includes(key)) {
      validationErrors.push(`Invalid root key: ${key}`);
    }
    if (validationErrors.length) {
      return validationErrors;
    }
  }
  if (!isPlainObject(callAPI)) {
    validationErrors.push('[CALL_API] property must be a plain JavaScript object');
    return validationErrors;
  }
  for (let key in callAPI) {
    if (!validCallAPIKeys.includes(key)) {
      validationErrors.push(`Invalid [CALL_API] key: ${key}`);
    }
    if (validationErrors.length) {
      return validationErrors;
    }
  }

  const { endpoint, method, body, headers, transform, types, bailout } = callAPI;
  if (typeof endpoint !== 'string' && typeof endpoint !== 'function') {
    validationErrors.push('[CALL_API].endpoint property must be a string or a function');
  }
  if (typeof method !== 'string') {
    validationErrors.push('[CALL_API].method property must be a string');
  } else if (!validMethods.includes(method.toUpperCase())) {
    validationErrors.push(`Invalid [CALL_API].method: ${method.toUpperCase()}`);
  }
  if (!Array.isArray(types) || types.length !== 3) {
    validationErrors.push('[CALL_API].types property must be an array of length 3');
  }
  if (typeof headers !== 'undefined' && !isPlainObject(headers)) {
    validationErrors.push('[CALL_API].headers property must be undefined, or a plain JavaScript object');
  }
  if (typeof transform !== 'undefined' && typeof transform !== 'function') {
    validationErrors.push('[CALL_API].transform property must be undefined, or a function');
  }
  if (typeof bailout !== 'undefined' && typeof bailout !== 'boolean' && typeof bailout !== 'function') {
    validationErrors.push('[CALL_API].bailout property must be undefined, a boolean, or a function');
  };
  return validationErrors;
}

export default validateRSAA;
