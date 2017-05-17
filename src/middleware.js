import isPlainObject from 'lodash.isplainobject';

import RSAA from './RSAA';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError, ApiError } from './errors' ;
import { getJSON, normalizeTypeDescriptors, actionWith } from './util';

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function apiMiddleware({ getState }) {
  return (next) => async (action) => {
    // Do not process actions without an [RSAA] property
    if (!isRSAA(action)) {
      return next(action);
    }

    // Try to dispatch an error request FSA for invalid RSAAs
    const validationErrors = validateRSAA(action);
    if (validationErrors.length) {
      const callAPI = action[RSAA];
      if (callAPI.types && Array.isArray(callAPI.types)) {
        let requestType = callAPI.types[0];
        if (requestType && requestType.type) {
          requestType = requestType.type;
        }
        next({
          type: requestType,
          payload: new InvalidRSAA(validationErrors),
          error: true
        });
      }
      return;
    }

    // Parse the validated RSAA action
    const callAPI = action[RSAA];
    var { endpoint, headers, options = {} } = callAPI;
    const { method, body, credentials, bailout, types } = callAPI;
    const [requestType, successType, failureType] = normalizeTypeDescriptors(types);

    // Should we bail out?
    try {
      if ((typeof bailout === 'boolean' && bailout) ||
          (typeof bailout === 'function' && bailout(getState()))) {
        return;
      }
    } catch (e) {
      return next(await actionWith(
        {
          ...requestType,
          payload: new RequestError('[RSAA].bailout function failed'),
          error: true
        },
        [action, getState()]
      ));
    }

    // Process [RSAA].endpoint function
    if (typeof endpoint === 'function') {
      try {
        endpoint = endpoint(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[RSAA].endpoint function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // Process [RSAA].headers function
    if (typeof headers === 'function') {
      try {
        headers = headers(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[RSAA].headers function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // Process [RSAA].options function
    if (typeof options === 'function') {
      try {
        options = options(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[RSAA].options function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // We can now dispatch the request FSA
    next(await actionWith(
      requestType,
      [action, getState()]
    ));

    try {
      // Make the API call
      var res = await fetch(endpoint, {
        ...options,
        method, body, credentials, headers
      });
    } catch(e) {
      // The request was malformed, or there was a network error
      return next(await actionWith(
        {
          ...requestType,
          payload: new RequestError(e.message),
          error: true
        },
        [action, getState()]
      ));
    }

    // Process the server response
    if (res.ok) {
      return next(await actionWith(
        successType,
        [action, getState(), res]
      ));
    } else {
      return next(await actionWith(
        {
          ...failureType,
          error: true
        },
        [action, getState(), res]
      ));
    }
  }
}

export { apiMiddleware };
