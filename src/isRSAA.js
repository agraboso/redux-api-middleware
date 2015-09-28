import validateRSAA from './validateRSAA';

/**
 * Is the given action a Redux Standard API-calling action?
 *
 * @function isRSAA
 * @access public
 * @param {Object} action - The action to check against the RSAA definition.
 * @returns {boolean}
 */
function isRSAA(action) {
  return !validateRSAA(action).length;
}

export default isRSAA;
