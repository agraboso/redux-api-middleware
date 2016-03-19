import fetch from 'isomorphic-fetch';
import isPlainObject from 'lodash.isplainobject';

import CALL_API from './CALL_API';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError, ApiError } from './errors' ;
import { getJSON, normalizeTypeDescriptors, actionWith } from './util';

const hooks = {};

function apiMiddlewareHooks({ before, after }) {
  if (typeof before === 'function') hooks.before = before;
  if (typeof after === 'function') hooks.after = after;

  return apiMiddleware;
}

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function apiMiddleware({ getState }) {
  return (next) => async (action) => {
    // Do not process actions without a [CALL_API] property
    if (!isRSAA(action)) {
      return next(action);
    }

    // Try to dispatch an error request FSA for invalid RSAAs
    const validationErrors = validateRSAA(action);
    if (validationErrors.length) {
      const callAPI = action[CALL_API];
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

    if (typeof hooks.before === 'function') {
      action = hooks.before(action);
    }

    // Parse the validated RSAA action
    const callAPI = action[CALL_API];
    var { endpoint, headers } = callAPI;
    const { method, body, credentials, bailout, types } = callAPI;
    const [requestType, successType, failureType] = normalizeTypeDescriptors(types);
    const handleDescriptor = (descriptor, callback) => {
      if (typeof callback === 'function') {
        return callback(descriptor);
      }

      return descriptor;
    };

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
          payload: new RequestError('[CALL_API].bailout function failed'),
          error: true
        },
        [action, getState()]
      ));
    }

    // Process [CALL_API].endpoint function
    if (typeof endpoint === 'function') {
      try {
        endpoint = endpoint(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[CALL_API].endpoint function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // Process [CALL_API].headers function
    if (typeof headers === 'function') {
      try {
        headers = headers(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[CALL_API].headers function failed'),
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
      var res = await fetch(endpoint, { method, body, credentials, headers });
    } catch(e) {
      // The request was malformed, or there was a network error
      const descriptor = await actionWith(
        {
          ...requestType,
          payload: new RequestError(e.message),
          error: true
        },
        [action, getState()]
      );
      return next(handleDescriptor(descriptor, hooks.after));
    }

    // Process the server response
    if (res.ok) {
      const descriptor = await actionWith(
        successType,
        [action, getState(), res]
      );
      return next(handleDescriptor(descriptor, hooks.after));
    } else {
      const descriptor = await actionWith(
        {
          ...failureType,
          error: true
        },
        [action, getState(), res]
      );
      return next(handleDescriptor(descriptor, hooks.after));
    }
  }
}

export { apiMiddleware, apiMiddlewareHooks };
