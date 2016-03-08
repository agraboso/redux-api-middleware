import { InternalError, ApiError } from './errors';

/**
 * Extract JSON body from a server response
 *
 * @function getJSON
 * @access public
 * @param {object} res - A raw response object
 * @returns {promise|undefined}
 */
async function getJSON(res) {
  const contentType = res.headers.get('Content-Type');
  const emptyCodes = [204, 205];

  if (!~emptyCodes.indexOf(res.status) && contentType && ~contentType.indexOf('json')) {
    return await res.json();
  } else {
    return await Promise.resolve();
  }
}

/**
 * Blow up string or symbol types into full-fledged type descriptors,
 *   and add defaults
 *
 * @function normalizeTypeDescriptors
 * @access private
 * @param {array} types - The [RSAA].types from a validated RSAA
 * @returns {array}
 */
function normalizeTypeDescriptors(types) {
  let [requestType, successType, failureType] = types;

  if (typeof requestType === 'string' || typeof requestType === 'symbol') {
    requestType = { type: requestType };
  }

  if (typeof successType === 'string' || typeof successType === 'symbol') {
    successType = { type: successType };
  }
  successType = {
    payload: (action, state, res) => getJSON(res),
    ...successType
  };

  if (typeof failureType === 'string' || typeof failureType === 'symbol') {
    failureType = { type: failureType };
  }
  failureType = {
    payload: (action, state, res) =>
      getJSON(res).then(
        (json) => new ApiError(res.status, res.statusText, json)
      ),
    ...failureType
  };

  return [requestType, successType, failureType];
}

/**
 * Evaluate a type descriptor to an FSA
 *
 * @function actionWith
 * @access private
 * @param {object} descriptor - A type descriptor
 * @param {array} args - The array of arguments for `payload` and `meta` function properties
 * @returns {object}
 */
async function actionWith(descriptor, args) {
  try {
    descriptor.payload = await (
      typeof descriptor.payload === 'function' ?
      descriptor.payload(...args) :
      descriptor.payload
    );
  } catch (e) {
    descriptor.payload = new InternalError(e.message);
    descriptor.error = true;
  }

  try {
    descriptor.meta = await (
      typeof descriptor.meta === 'function' ?
      descriptor.meta(...args) :
      descriptor.meta
    );
  } catch (e) {
    delete descriptor.meta;
    descriptor.payload = new InternalError(e.message);
    descriptor.error = true;
  }

  return descriptor;
}

export { getJSON, normalizeTypeDescriptors, actionWith };
