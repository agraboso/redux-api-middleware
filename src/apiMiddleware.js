import CALL_API from './CALL_API';
import isRSAA from './isRSAA';
import callApi from './callApi';

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

/**
 * A Redux middleware that interprets actions with CALL_API info specified.
 * Performs the call and promises when such actions are dispatched.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function apiMiddleware({ getState }) {
  return (next) => (action) => {
    const callAPI = action[CALL_API];
    if (!isRSAA(action)) {
      return next(action);
    }

    let { endpoint } = callAPI;
    const { method, body, headers, schema, types, bailout } = callAPI;
    if (typeof endpoint === 'function') {
      endpoint = endpoint(getState());
    }
    if ((typeof bailout === 'boolean' && bailout) ||
        (typeof bailout === 'function' && bailout(getState()))) {
      return Promise.resolve('Bailing out');
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
      (response) => next(actionWith({ type: successType }, response)),
      (error) => next(actionWith({
        type: failureType,
        payload: error,
        error: true
      }))
    );
  };
}

export default apiMiddleware;
