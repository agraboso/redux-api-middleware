import test from 'tape';
import 'isomorphic-fetch';
import nock from 'nock';

// Public package exports
import {
  RSAA,
  CALL_API,
  isRSAA,
  validateRSAA,
  isValidRSAA,
  InvalidRSAA,
  InternalError,
  RequestError,
  ApiError,
  getJSON,
  apiMiddleware
} from '../src';

// Private module exports
import { isValidTypeDescriptor } from '../src/validation';
import { normalizeTypeDescriptors, actionWith } from '../src/util';

test('CALL_API is aliased to RSAA', t => {
  t.equal(RSAA, CALL_API);
  t.end();
});

test('isRSAA must identify RSAAs', t => {
  const action1 = '';
  t.notOk(isRSAA(action1), 'RSAAs must be plain JavaScript objects');

  const action2 = {};
  t.notOk(isRSAA(action2), 'RSAAs must have an [RSAA] property');

  const action3 = {
    [RSAA]: {}
  };
  t.ok(isRSAA(action3), 'isRSAA must return true for an RSAA');

  t.end();
});

test('isValidTypeDescriptor must identify conformant type descriptors', t => {
  var descriptor1 = '';
  t.notOk(
    isValidTypeDescriptor(descriptor1),
    'type descriptors must be plain JavaScript objects'
  );

  var descriptor2 = {
    type: '',
    invalidKey: ''
  };
  t.notOk(
    isValidTypeDescriptor(descriptor2),
    'type descriptors must not have properties other than type, payload and meta'
  );

  var descriptor3 = {};
  t.notOk(
    isValidTypeDescriptor(descriptor3),
    'type descriptors must have a type property'
  );

  var descriptor4 = {
    type: {}
  };
  t.notOk(
    isValidTypeDescriptor(descriptor4),
    'type property must be a string, or a symbol'
  );

  var descriptor5 = {
    type: ''
  };
  t.ok(isValidTypeDescriptor(descriptor5), 'type property may be a string');

  var descriptor6 = {
    type: Symbol()
  };
  t.ok(isValidTypeDescriptor(descriptor6), 'type property may be a symbol');

  t.end();
});

test('validateRSAA/isValidRSAA must identify conformant RSAAs', t => {
  const action1 = '';
  t.ok(
    validateRSAA(action1).length === 1 &&
      validateRSAA(action1).includes(
        'RSAAs must be plain JavaScript objects with an [RSAA] property'
      ),
    'RSAAs must be plain JavaScript objects with an [RSAA] property (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action1),
    'RSAAs must be plain JavaScript objects with an [RSAA] property (isValidRSAA)'
  );

  const action2 = {
    [RSAA]: {},
    invalidKey: ''
  };
  t.ok(
    validateRSAA(action2).includes('Invalid root key: invalidKey'),
    'RSAAs must not have properties other than [RSAA] (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action2),
    'RSAAs must not have properties other than [RSAA] (isValidRSAA)'
  );

  const action3 = {
    [RSAA]: ''
  };
  t.ok(
    validateRSAA(action3).includes(
      '[RSAA] property must be a plain JavaScript object'
    ),
    '[RSAA] property must be a plain JavaScript object (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action3),
    '[RSAA] property must be a plain JavaScript object (isValidRSAA)'
  );

  const action4 = {
    [RSAA]: { invalidKey: '' }
  };
  t.ok(
    validateRSAA(action4).includes('Invalid [RSAA] key: invalidKey'),
    '[RSAA] must not have properties other than endpoint, method, types, body, headers, credentials, options and bailout (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action4),
    '[RSAA] must not have properties other than endpoint, method, types, body, headers, credentials, options and bailout (isValidRSAA)'
  );

  const action5 = {
    [RSAA]: {}
  };
  t.ok(
    validateRSAA(action5).includes(
      '[RSAA] must have an endpoint property',
      '[RSAA] must have a method property',
      '[RSAA] must have a types property'
    ),
    '[RSAA] must have endpoint, method, and types properties (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action5),
    '[RSAA] must have endpoint, method, and types properties (isValidRSAA)'
  );

  const action6 = {
    [RSAA]: {
      endpoint: {},
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action6).includes(
      '[RSAA].endpoint property must be a string or a function'
    ),
    '[RSAA].endpoint must be a string or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action6),
    '[RSAA].endpoint must be a string or a function (isValidRSAA)'
  );

  const action7 = {
    [RSAA]: {
      endpoint: '',
      method: {},
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action7).includes('[RSAA].method property must be a string'),
    '[RSAA].method property must be a string (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action7),
    '[RSAA].method property must be a string (isValidRSAA)'
  );

  const action8 = {
    [RSAA]: {
      endpoint: '',
      method: 'InvalidMethod',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action8).includes('Invalid [RSAA].method: INVALIDMETHOD'),
    "[RSAA].method must be one of the strings 'GET', 'HEAD', 'POST', 'PUT', 'PATCH' 'DELETE', or 'OPTIONS' (validateRSAA)"
  );
  t.notOk(
    isValidRSAA(action8),
    "[RSAA].method must be one of the strings 'GET', 'HEAD', 'POST', 'PUT', 'PATCH' 'DELETE', or 'OPTIONS' (isValidRSAA)"
  );

  const action9 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: ''
    }
  };
  t.ok(
    validateRSAA(action9).includes(
      '[RSAA].headers property must be undefined, a plain JavaScript object, or a function'
    ),
    '[RSAA].headers property must be undefined, a plain JavaScript object, or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action9),
    '[RSAA].headers property must be undefined, a plain JavaScript object, or a function (isValidRSAA)'
  );

  const action10 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      credentials: {}
    }
  };
  t.ok(
    validateRSAA(action10).includes(
      '[RSAA].credentials property must be undefined, or a string'
    ),
    '[RSAA].credentials property must be undefined or a string (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action10),
    '[RSAA].credentials property must be undefined or a string (isValidRSAA)'
  );

  const action11 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      credentials: 'InvalidCredentials'
    }
  };
  t.ok(
    validateRSAA(action11).includes(
      'Invalid [RSAA].credentials: InvalidCredentials'
    ),
    "[RSAA].credentials property must be one of the string 'omit', 'same-origin', or 'include' (validateRSAA)"
  );
  t.notOk(
    isValidRSAA(action11),
    "[RSAA].credentials property must be one of the string 'omit', 'same-origin', or 'include' (isValidRSAA)"
  );

  const action12 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: ''
    }
  };
  t.ok(
    validateRSAA(action12).includes(
      '[RSAA].bailout property must be undefined, a boolean, or a function'
    ),
    '[RSAA].bailout must be undefined, a boolean, or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action12),
    '[RSAA].bailout must be undefined, a boolean, or a function (isValidRSAA)'
  );

  const action13 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: {}
    }
  };
  t.ok(
    validateRSAA(action13).includes(
      '[RSAA].types property must be an array of length 3'
    ),
    '[RSAA].types property must be an array (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action13),
    '[RSAA].types property must be an array (isRSAA)'
  );

  const action14 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['a', 'b']
    }
  };
  t.ok(
    validateRSAA(action14).includes(
      '[RSAA].types property must be an array of length 3'
    ),
    '[RSAA].types property must have length 3 (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action14),
    '[RSAA].types property must have length 3 (isRSAA)'
  );

  const action15 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: [{}, {}, {}]
    }
  };
  t.ok(
    validateRSAA(action15).includes(
      'Invalid request type',
      'Invalid success type',
      'Invalid failure type'
    ),
    'Each element in [RSAA].types property must be a string, a symbol, or a type descriptor (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action15),
    'Each element in [RSAA].types property must be a string, a symbol, or a type descriptor (isRSAA)'
  );

  const action16 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.equal(
    validateRSAA(action16).length,
    0,
    '[RSAA].endpoint may be a string (validateRSAA)'
  );
  t.ok(isValidRSAA(action16), '[RSAA].endpoint may be a string (isValidRSAA)');

  const action17 = {
    [RSAA]: {
      endpoint: () => '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.equal(
    validateRSAA(action17).length,
    0,
    '[RSAA].endpoint may be a function (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action17),
    '[RSAA].endpoint may be a function (isValidRSAA)'
  );

  const action18 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: {}
    }
  };
  t.equal(
    validateRSAA(action18).length,
    0,
    '[RSAA].headers may be a plain JavaScript object (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action18),
    '[RSAA].headers may be a plain JavaScript object (isRSAA)'
  );

  const action19 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: () => {}
    }
  };
  t.equal(
    validateRSAA(action19).length,
    0,
    '[RSAA].headers may be a function (validateRSAA)'
  );
  t.ok(isValidRSAA(action19), '[RSAA].headers may be a function (isRSAA)');

  const action20 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: false
    }
  };
  t.equal(
    validateRSAA(action20).length,
    0,
    '[RSAA].bailout may be a boolean (validateRSAA)'
  );
  t.ok(isValidRSAA(action20), '[RSAA].bailout may be a boolean (isRSAA)');

  const action21 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: () => false
    }
  };
  t.equal(
    validateRSAA(action21).length,
    0,
    '[RSAA].bailout may be a function (validateRSAA)'
  );
  t.ok(isValidRSAA(action21), '[RSAA].bailout may be a function (isRSAA)');

  const action22 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: [Symbol(), Symbol(), Symbol()]
    }
  };
  t.equal(
    validateRSAA(action22).length,
    0,
    'Each element in [RSAA].types may be a symbol (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action22),
    'Each element in [RSAA].types may be a symbol (isRSAA)'
  );

  const action23 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        {
          type: 'SUCCESS',
          payload: 'successPayload',
          meta: 'successMeta'
        },
        {
          type: 'FAILURE',
          payload: 'failurePayload',
          meta: 'failureMeta'
        }
      ]
    }
  };
  t.equal(
    validateRSAA(action23).length,
    0,
    'Each element in [RSAA].types may be a type descriptor (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action23),
    'Each element in [RSAA].types may be a type descriptor (isRSAA)'
  );

  const action24 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      options: ''
    }
  };
  t.ok(
    validateRSAA(action24).includes(
      '[RSAA].options property must be undefined, a plain JavaScript object, or a function'
    ),
    '[RSAA].options property must be undefined, a plain JavaScript object, or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action24),
    '[RSAA].options property must be undefined, a plain JavaScript object, or a function (isValidRSAA)'
  );

  const action25 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      options: {}
    }
  };
  t.equal(
    validateRSAA(action25).length,
    0,
    '[RSAA].options may be a plain JavaScript object (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action25),
    '[RSAA].options may be a plain JavaScript object (isRSAA)'
  );

  const action26 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      options: () => {}
    }
  };
  t.equal(
    validateRSAA(action26).length,
    0,
    '[RSAA].options may be a function (validateRSAA)'
  );
  t.ok(isValidRSAA(action26), '[RSAA].options may be a function (isRSAA)');

  const action27 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      fetch: () => {}
    }
  };
  t.ok(
    isValidRSAA(action27),
    '[RSAA].fetch property must be a function (isRSAA)'
  );

  const action28 = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      fetch: {}
    }
  };
  t.notOk(
    isValidRSAA(action28),
    '[RSAA].fetch property must be a function (isRSAA)'
  );

  t.end();
});

test('InvalidRSAA', t => {
  const validationErrors = ['validation error 1', 'validation error 2'];
  const error = new InvalidRSAA(validationErrors);

  t.ok(error instanceof Error, 'is an error object');
  t.equal(error.name, 'InvalidRSAA', 'has correct name property');
  t.equal(error.message, 'Invalid RSAA', 'has correct message');
  t.deepEqual(
    error.validationErrors,
    validationErrors,
    'has correct validationErrors property'
  );

  t.end();
});

test('InternalError', t => {
  const error = new InternalError('error thrown in payload function');

  t.ok(error instanceof Error, 'is an error object');
  t.equal(error.name, 'InternalError', 'has correct name property');
  t.equal(
    error.message,
    'error thrown in payload function',
    'has correct message'
  );

  t.end();
});

test('RequestError', t => {
  const error = new RequestError('Network request failed');

  t.ok(error instanceof Error, 'is an error object');
  t.equal(error.name, 'RequestError', 'has correct name property');
  t.equal(error.message, 'Network request failed', 'has correct message');

  t.end();
});

test('ApiError', t => {
  const json = { error: 'Resource not found' };
  const error = new ApiError(404, 'Not Found', json);

  t.ok(error instanceof Error, 'is an error object');
  t.equal(error.name, 'ApiError', 'has correct name property');
  t.equal(error.message, '404 - Not Found', 'has correct message');
  t.equal(error.status, 404, 'has correct status property');
  t.equal(error.statusText, 'Not Found', 'has correct statusText property');
  t.equal(error.response, json, 'has correct response property');

  t.end();
});

test('getJSON', async t => {
  const res1 = {
    headers: {
      get(name) {
        return name === 'Content-Type' ? 'application/json' : undefined;
      }
    },
    json() {
      return Promise.resolve({ message: 'ok' });
    }
  };
  const result1 = await getJSON(res1);
  t.deepEqual(
    result1,
    { message: 'ok' },
    "returns the JSON body of a response with a JSONy 'Content-Type' header"
  );

  const res2 = {
    headers: {
      get(name) {
        return;
      }
    }
  };
  try {
    const result2 = await getJSON(res2);
  } catch (e) {
    t.pass(
      "returns a rejected promise for a response with a not-JSONy 'Content-Type' header"
    );
  }

  t.end();
});

test('normalizeTypeDescriptors', t => {
  const types1 = ['REQUEST', 'SUCCESS', 'FAILURE'];
  const descriptors1 = normalizeTypeDescriptors(types1);
  t.ok(
    Array.isArray(descriptors1) && descriptors1.length === 3,
    'returns an array of length 3'
  );
  t.deepEqual(
    descriptors1[0].type,
    'REQUEST',
    'request type has the correct type property'
  );
  t.equal(
    Object.keys(descriptors1[0]).length,
    1,
    'request type has no other properties by default'
  );
  t.deepEqual(
    descriptors1[1].type,
    'SUCCESS',
    'success type has the correct type property'
  );
  t.ok(
    'payload' in descriptors1[1],
    'success type has a payload property by default'
  );
  t.equal(
    Object.keys(descriptors1[1]).length,
    2,
    'success type has no other properties by default'
  );
  t.deepEqual(
    descriptors1[2].type,
    'FAILURE',
    'failure type has the correct type property'
  );
  t.ok(
    'payload' in descriptors1[2],
    'failure type has a payload property by default'
  );
  t.equal(
    Object.keys(descriptors1[2]).length,
    2,
    'failure type has no other properties by default'
  );

  const types2 = [
    {
      type: 'REQUEST',
      payload: 'requestPayload',
      meta: 'requestMeta'
    },
    {
      type: 'SUCCESS',
      payload: 'successPayload',
      meta: 'successMeta'
    },
    {
      type: 'FAILURE',
      payload: 'failurePayload',
      meta: 'failureMeta'
    }
  ];
  const descriptors2 = normalizeTypeDescriptors(types2);
  t.equal(
    descriptors2[0].payload,
    'requestPayload',
    'request type must accept a custom payload property'
  );
  t.equal(
    descriptors2[0].meta,
    'requestMeta',
    'request type must accept a custom meta property'
  );
  t.equal(
    descriptors2[1].payload,
    'successPayload',
    'success type must accept a custom payload property'
  );
  t.equal(
    descriptors2[1].meta,
    'successMeta',
    'success type must accept a custom meta property'
  );
  t.equal(
    descriptors2[2].payload,
    'failurePayload',
    'failure type must accept a custom payload property'
  );
  t.equal(
    descriptors2[2].meta,
    'failureMeta',
    'failure type must accept a custom meta property'
  );

  t.end();
});

test('actionWith', async t => {
  const descriptor1 = {
    type: 'REQUEST',
    payload: 'somePayload',
    meta: 'someMeta',
    error: true
  };
  const fsa1 = await actionWith(descriptor1);
  t.equal(
    fsa1.type,
    'REQUEST',
    'must set FSA type property to incoming descriptor type property'
  );
  t.equal(
    fsa1.payload,
    'somePayload',
    'must set FSA payload property to incoming descriptor payload property'
  );
  t.equal(
    fsa1.meta,
    'someMeta',
    'must set FSA meta property to incoming descriptor meta property'
  );
  t.ok(
    fsa1.error,
    'must set FSA error property to incoming descriptor error property'
  );

  const passedArgs = ['action', 'state', 'res'];
  const descriptor2 = {
    type: 'REQUEST',
    payload: (...args) => {
      t.pass('must call a payload function');
      t.deepEqual(
        args,
        passedArgs,
        'payload function must receive its arguments'
      );
    },
    meta: (...args) => {
      t.pass('must call a meta function');
      t.deepEqual(args, passedArgs, 'meta function must receive its arguments');
    }
  };
  const fsa2 = await actionWith(descriptor2, passedArgs);

  const descriptor3 = {
    type: 'REQUEST',
    payload: (...args) => {
      throw new Error('error in payload function');
    }
  };
  const fsa3 = await actionWith(descriptor3, passedArgs);
  t.equal(
    fsa3.payload.message,
    'error in payload function',
    'must set FSA payload property to an error if a custom payload function throws'
  );
  t.ok(
    fsa3.error,
    'must set FSA error property to true if a custom payload function throws'
  );

  const descriptor4 = {
    type: 'REQUEST',
    meta: (...args) => {
      throw new Error('error in meta function');
    }
  };
  const fsa4 = await actionWith(descriptor4, passedArgs);
  t.equal(
    fsa4.payload.message,
    'error in meta function',
    'must set FSA payload property to an error if a custom meta function throws'
  );
  t.ok(
    fsa4.error,
    'must set FSA error property to true if a custom meta function throws'
  );

  t.end();
});

test('apiMiddleware must be a Redux middleware', t => {
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = () => {};
  const actionHandler = nextHandler(doNext);

  t.equal(apiMiddleware.length, 1, 'apiMiddleware must take one argument');

  t.equal(
    typeof nextHandler,
    'function',
    'apiMiddleware must return a function to handle next'
  );

  t.equal(nextHandler.length, 1, 'next handler must take one argument');

  t.equal(
    typeof actionHandler,
    'function',
    'next handler must return a function to handle action'
  );

  t.equal(actionHandler.length, 1, 'action handler must take one argument');

  t.end();
});

test('apiMiddleware must pass actions without an [RSAA] property to the next handler', t => {
  const anAction = {};
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(anAction, action, 'original action passed to the next handler');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(2);
  actionHandler(anAction);
});

test("apiMiddleware mustn't return a promise on actions without a [RSAA] property", t => {
  const anAction = {};
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => action;
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  const noProm = actionHandler(anAction);
  t.notEqual(typeof noProm.then, 'function', 'no promise returned');
});

test('apiMiddleware must return a promise on actions with a [RSAA] property', t => {
  const anAction = { [RSAA]: {} };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => action;
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  const yesProm = actionHandler(anAction);
  t.equal(typeof yesProm.then, 'function', 'promise returned');
});

test('apiMiddleware must dispatch an error request FSA for an invalid RSAA with a string request type', t => {
  const anAction = {
    [RSAA]: {
      types: ['REQUEST']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.name,
      'InvalidRSAA',
      'dispatched FSA has correct payload property'
    );
    t.equal(action.meta, undefined, 'dispatched FSA has no meta property');
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA for an invalid RSAA with a descriptor request type', t => {
  const anAction = {
    [RSAA]: {
      types: [
        {
          type: 'REQUEST'
        }
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.name,
      'InvalidRSAA',
      'dispatched FSA has correct payload property'
    );
    t.equal(action.meta, undefined, 'dispatched FSA has no meta property');
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must do nothing for an invalid RSAA without a request type', t => {
  const anAction = {
    [RSAA]: {}
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  actionHandler(anAction);
  setTimeout(() => {
    t.pass('next handler not called');
    t.end();
  }, 200);
});

test('apiMiddleware must dispatch an error request FSA when [RSAA].bailout fails', t => {
  const anAction = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      bailout: () => {
        throw new Error();
      },
      types: [
        {
          type: 'REQUEST',
          payload: () => 'ignoredPayload',
          meta: () => 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.message,
      '[RSAA].bailout function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [RSAA].body fails', t => {
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      body: () => {
        throw new Error();
      },
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'ignoredPayload',
          meta: 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.message,
      '[RSAA].body function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [RSAA].endpoint fails', t => {
  const anAction = {
    [RSAA]: {
      endpoint: () => {
        throw new Error();
      },
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'ignoredPayload',
          meta: 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.message,
      '[RSAA].endpoint function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [RSAA].headers fails', t => {
  const anAction = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      headers: () => {
        throw new Error();
      },
      types: [
        {
          type: 'REQUEST',
          payload: 'ignoredPayload',
          meta: 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.message,
      '[RSAA].headers function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [RSAA].options fails', t => {
  const anAction = {
    [RSAA]: {
      endpoint: '',
      method: 'GET',
      options: () => {
        throw new Error();
      },
      types: [
        {
          type: 'REQUEST',
          payload: 'ignoredPayload',
          meta: 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.pass('next handler called');
    t.equal(action.type, 'REQUEST', 'dispatched FSA has correct type property');
    t.equal(
      action.payload.message,
      '[RSAA].options function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(action.error, 'dispatched FSA has correct error property');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA on a request error', t => {
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1', // We haven't mocked this
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'ignoredPayload',
          meta: 'someMeta'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        if (!action.error) {
          t.pass('next handler called');
          t.equal(
            action.type,
            'REQUEST',
            'dispatched non-error FSA has correct type property'
          );
          t.equal(
            action.payload,
            'ignoredPayload',
            'dispatched non-error FSA has correct payload property'
          );
          t.equal(
            action.meta,
            'someMeta',
            'dispatched non-error FSA has correct meta property'
          );
          t.notOk(
            action.error,
            'dispatched non-error FSA has correct error property'
          );
          break;
        } else {
          t.pass('next handler called');
          t.equal(
            action.type,
            'REQUEST',
            'dispatched error FSA has correct type property'
          );
          t.equal(
            action.payload.name,
            'RequestError',
            'dispatched error FSA has correct payload property'
          );
          t.equal(
            action.meta,
            'someMeta',
            'dispatched error FSA has correct meta property'
          );
          t.ok(action.error, 'dispatched error FSA has correct error property');
        }
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(10);
  actionHandler(anAction);
});

test('apiMiddleware must use an [RSAA].bailout boolean when present', t => {
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: true
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  actionHandler(anAction);
  setTimeout(() => {
    t.pass('next handler not called');
    t.end();
  }, 200);
});

test('apiMiddleware must use an [RSAA].bailout function when present', t => {
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: () => {
        t.pass('[RSAA].bailout function called');
        return true;
      }
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [RSAA].body function when present', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      body: () => {
        t.pass('[RSAA].body function called');
        return 'body';
      },
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [RSAA].endpoint function when present', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const anAction = {
    [RSAA]: {
      endpoint: () => {
        t.pass('[RSAA].endpoint function called');
        return 'http://127.0.0.1/api/users/1';
      },
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [RSAA].headers function when present', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      headers: () => {
        t.pass('[RSAA].headers function called');
      },
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [RSAA].options function when present', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      options: () => {
        t.pass('[RSAA].options function called');
      },
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use payload property of request type descriptor when it is a function', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const expectedState = { foo: 'bar' };
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          meta: 'requestMeta',
          payload: (action, state) => {
            t.pass('request type descriptor payload function has been called');
            t.equal(
              action,
              anAction,
              'request type descriptor payload function has been called with correct action parameter'
            );
            t.equal(
              state,
              expectedState,
              'request type descriptor payload function has been called with correct state parameter'
            );
            return 'requestPayload';
          }
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {
    return expectedState;
  };
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    if (action.type === 'REQUEST') {
      t.pass('request FSA passed to the next handler');
      t.equal(
        action.meta,
        'requestMeta',
        'request FSA has correct meta property'
      );
      t.equal(
        action.payload,
        'requestPayload',
        'request FSA has correct payload property'
      );
      t.notOk(action.error, 'request FSA has correct error property');
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(7);
  actionHandler(anAction);
});

test('apiMiddleware must use meta property of request type descriptor when it is a function', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const expectedState = { foo: 'bar' };
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          meta: (action, state) => {
            t.pass('request type descriptor meta function has been called');
            t.equal(
              action,
              anAction,
              'request type descriptor meta function has been called with correct action parameter'
            );
            t.equal(
              state,
              expectedState,
              'request type descriptor meta function has been called with correct state parameter'
            );
            return 'requestMeta';
          },
          payload: 'requestPayload'
        },
        'SUCCESS',
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {
    return expectedState;
  };
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    if (action.type === 'REQUEST') {
      t.pass('request FSA passed to the next handler');
      t.equal(
        action.meta,
        'requestMeta',
        'request FSA has correct meta property'
      );
      t.equal(
        action.payload,
        'requestPayload',
        'request FSA has correct payload property'
      );
      t.notOk(action.error, 'request FSA has correct error property');
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(7);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with a non-empty JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200, { username: 'Alice' }, { 'Content-Type': 'application/json' });
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        {
          type: 'SUCCESS',
          meta: 'successMeta'
        },
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'SUCCESS':
        t.pass('success FSA passed to the next handler');
        t.deepEqual(
          action.payload,
          { username: 'Alice' },
          'success FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'successMeta',
          'success FSA has correct meta property'
        );
        t.notOk(action.error, 'success FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with an empty JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200, {}, { 'Content-Type': 'application/json' });
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        {
          type: 'SUCCESS',
          meta: 'successMeta'
        },
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'SUCCESS':
        t.pass('success FSA passed to the next handler');
        t.deepEqual(
          action.payload,
          {},
          'success FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'successMeta',
          'success FSA has correct meta property'
        );
        t.notOk(action.error, 'success FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA with an error state on a successful API call with an invalid JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200, '', { 'Content-Type': 'application/json' });

  const error = new InternalError('Expected error - simulating invalid JSON');

  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        {
          type: 'SUCCESS',
          meta: 'successMeta',
          payload: () => {
            throw error;
          }
        },
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'SUCCESS':
        t.pass('success FSA passed to the next handler');
        t.deepEqual(
          action.payload,
          error,
          'success FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'successMeta',
          'success FSA has correct meta property'
        );
        t.ok(action.error, 'success FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with a non-JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        {
          type: 'SUCCESS',
          meta: 'successMeta'
        },
        'FAILURE'
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'SUCCESS':
        t.pass('success FSA passed to the next handler');
        t.deepEqual(
          typeof action.payload,
          'undefined',
          'success FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'successMeta',
          'success FSA has correct meta property'
        );
        t.notOk(action.error, 'success FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with a non-empty JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(
      404,
      { error: 'Resource not found' },
      { 'Content-Type': 'application/json' }
    );
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        'SUCCESS',
        {
          type: 'FAILURE',
          meta: 'failureMeta'
        }
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'FAILURE':
        t.pass('failure FSA passed to the next handler');
        t.deepEqual(
          action.payload.response,
          { error: 'Resource not found' },
          'failure FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'failureMeta',
          'failure FSA has correct meta property'
        );
        t.ok(action.error, 'failure FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with an empty JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(404, {}, { 'Content-Type': 'application/json' });
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        'SUCCESS',
        {
          type: 'FAILURE',
          meta: 'failureMeta'
        }
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'FAILURE':
        t.pass('failure FSA passed to the next handler');
        t.deepEqual(
          action.payload.response,
          {},
          'failure FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'failureMeta',
          'failure FSA has correct meta property'
        );
        t.ok(action.error, 'failure FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with a non-JSON response', t => {
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(404);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: [
        {
          type: 'REQUEST',
          payload: 'requestPayload',
          meta: 'requestMeta'
        },
        'SUCCESS',
        {
          type: 'FAILURE',
          meta: 'failureMeta'
        }
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'REQUEST':
        t.pass('request FSA passed to the next handler');
        t.equal(
          action.payload,
          'requestPayload',
          'request FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'requestMeta',
          'request FSA has correct meta property'
        );
        t.notOk(action.error, 'request FSA has correct error property');
        break;
      case 'FAILURE':
        t.pass('failure FSA passed to the next handler');
        t.deepEqual(
          typeof action.payload.response,
          'undefined',
          'failure FSA has correct payload property'
        );
        t.equal(
          action.meta,
          'failureMeta',
          'failure FSA has correct meta property'
        );
        t.ok(action.error, 'failure FSA has correct error property');
        break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must use a [RSAA].fetch custom fetch wrapper when present', t => {
  const asyncWorker = async () => 'Done!';
  const responseBody = {
    id: 1,
    name: 'Alan',
    error: false
  };
  const api = nock('http://127.0.0.1')
    .get('/api/users/1')
    .reply(200, responseBody);
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      fetch: async (endpoint, opts) => {
        t.pass('custom fetch handler called');

        // Simulate some async process like retrieving cache
        await asyncWorker();

        const res = await fetch(endpoint, opts);
        const json = await res.json();

        return new Response(
          JSON.stringify({
            ...json,
            foo: 'bar'
          }),
          {
            // Example of custom `res.ok`
            status: json.error ? 500 : 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      },
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'SUCCESS':
        t.deepEqual(
          action.payload,
          {
            ...responseBody,
            foo: 'bar'
          },
          'custom response passed to the next handler'
        );
        break;
    }
  };

  const actionHandler = nextHandler(doNext);

  t.plan(2);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch correct error payload when custom fetch wrapper returns an error response', t => {
  const anAction = {
    [RSAA]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      fetch: async (endpoint, opts) => {
        return new Response(
          JSON.stringify({
            foo: 'bar'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      },
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = action => {
    switch (action.type) {
      case 'FAILURE':
        t.ok(action.payload instanceof Error);
        t.pass('error action dispatched');
        t.deepEqual(
          action.payload.response,
          {
            foo: 'bar'
          },
          'custom response passed to the next handler'
        );
        break;
    }
  };

  const actionHandler = nextHandler(doNext);

  t.plan(3);
  actionHandler(anAction);
});
