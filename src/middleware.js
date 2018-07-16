import RSAA from './RSAA';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError, InternalError } from './errors';
import { normalizeTypeDescriptors, actionWith } from './util';

/**
 * Default options for redux-api-middleware
 * These can be customized by passing options into `createMiddleware`
 * @type {Object}
 */
const defaults = {
  ok: res => res.ok,
  fetch
};

/**
 * A middleware creator used to create a ReduxApiMiddleware
 * with custom defaults
 *
 * @type {function}
 * @returns {ReduxMiddleware}
 * @access public
 */
function createMiddleware(options = {}) {
  const middlewareOptions = Object.assign({}, defaults, options);

  return ({ getState }) => next => action => {
    // Do not process actions without an [RSAA] property
    if (!isRSAA(action)) {
      return next(action);
    }

    return (async () => {
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
      var {
        endpoint,
        body,
        headers,
        options = {},
        fetch: doFetch = middlewareOptions.fetch,
        ok = middlewareOptions.ok
      } = callAPI;
      const { method, credentials, bailout, types } = callAPI;
      const [requestType, successType, failureType] = normalizeTypeDescriptors(
        types
      );

      // Should we bail out?
      try {
        if (
          (typeof bailout === 'boolean' && bailout) ||
          (typeof bailout === 'function' && bailout(getState()))
        ) {
          return;
        }
      } catch (e) {
        return next(
          await actionWith(
            {
              ...failureType,
              payload: new RequestError('[RSAA].bailout function failed'),
              error: true
            },
            [action, getState()]
          )
        );
      }

      // Process [RSAA].endpoint function
      if (typeof endpoint === 'function') {
        try {
          endpoint = endpoint(getState());
        } catch (e) {
          return next(
            await actionWith(
              {
                ...failureType,
                payload: new RequestError('[RSAA].endpoint function failed'),
                error: true
              },
              [action, getState()]
            )
          );
        }
      }

      // Process [RSAA].body function
      if (typeof body === 'function') {
        try {
          body = body(getState());
        } catch (e) {
          return next(
            await actionWith(
              {
                ...failureType,
                payload: new RequestError('[RSAA].body function failed'),
                error: true
              },
              [action, getState()]
            )
          );
        }
      }

      // Process [RSAA].headers function
      if (typeof headers === 'function') {
        try {
          headers = headers(getState());
        } catch (e) {
          return next(
            await actionWith(
              {
                ...failureType,
                payload: new RequestError('[RSAA].headers function failed'),
                error: true
              },
              [action, getState()]
            )
          );
        }
      }

      // Process [RSAA].options function
      if (typeof options === 'function') {
        try {
          options = options(getState());
        } catch (e) {
          return next(
            await actionWith(
              {
                ...failureType,
                payload: new RequestError('[RSAA].options function failed'),
                error: true
              },
              [action, getState()]
            )
          );
        }
      }

      // We can now dispatch the request FSA
      if (
        typeof requestType.payload === 'function' ||
        typeof requestType.meta === 'function'
      ) {
        next(await actionWith(requestType, [action, getState()]));
      } else {
        next(requestType);
      }

      let res;
      try {
        // Make the API call
        res = await doFetch(endpoint, {
          ...options,
          method,
          body: body || undefined,
          credentials,
          headers: headers || {}
        });
      } catch (e) {
        // The request was malformed, or there was a network error
        return next(
          await actionWith(
            {
              ...failureType,
              payload: new RequestError(e.message),
              error: true
            },
            [action, getState()]
          )
        );
      }

      let isOk;
      try {
        isOk = ok(res);
      } catch (e) {
        return next(
          await actionWith(
            {
              ...failureType,
              payload: new InternalError('[RSAA].ok function failed'),
              error: true
            },
            [action, getState(), res]
          )
        );
      }

      // Process the server response
      if (isOk) {
        return next(await actionWith(successType, [action, getState(), res]));
      } else {
        return next(
          await actionWith(
            {
              ...failureType,
              error: true
            },
            [action, getState(), res]
          )
        );
      }
    })();
  };
}

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function apiMiddleware({ getState }) {
  return createMiddleware()({ getState });
}

export { createMiddleware, apiMiddleware };
