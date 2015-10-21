import test from 'tape';
import { Schema, normalize, arrayOf } from 'normalizr';
import nock from 'nock';

import CALL_API from '../src/CALL_API';
import { isRSAA, isValidTypeDescriptor, validateRSAA, isValidRSAA } from '../src/validation';
import { InvalidRSAA, InternalError, RequestError, ApiError } from '../src/errors';
import { getJSON, normalizeTypeDescriptors, actionWith } from '../src/util';
import { apiMiddleware } from '../src/middleware';

test('isRSAA must identify RSAAs', (t) => {
  const action1 = '';
  t.notOk(
    isRSAA(action1),
    'RSAAs must be plain JavaScript objects'
  );

  const action2 = {};
  t.notOk(
    isRSAA(action2),
    'RSAAs must have a [CALL_API] property'
  );

  const action3 = {
    [CALL_API]: {}
  };
  t.ok(
    isRSAA(action3),
    'isRSAA must return true for an RSAA'
  );

  t.end();
});

test('isValidTypeDescriptor must identify conformant type descriptors', (t) => {
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
  t.ok(
    isValidTypeDescriptor(descriptor5),
    'type property may be a string'
  );

  var descriptor6 = {
    type: Symbol()
  };
  t.ok(
    isValidTypeDescriptor(descriptor6),
    'type property may be a symbol'
  );

  t.end();
});

test('validateRSAA/isValidRSAA must identify conformant RSAAs', (t) => {
  const action1 = '';
  t.ok(
    validateRSAA(action1).length === 1 &&
    validateRSAA(action1).includes('RSAAs must be plain JavaScript objects with a [CALL_API] property'),
    'RSAAs must be plain JavaScript objects with a [CALL_API] property (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action1),
    'RSAAs must be plain JavaScript objects with a [CALL_API] property (isValidRSAA)'
  );

  const action2 = {
    [CALL_API]: {},
    invalidKey: ''
  };
  t.ok(
    validateRSAA(action2).includes('Invalid root key: invalidKey'),
    'RSAAs must not have properties other than [CALL_API] (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action2),
    'RSAAs must not have properties other than [CALL_API] (isValidRSAA)'
  );

  const action3 = {
    [CALL_API]: ''
  };
  t.ok(
    validateRSAA(action3).includes('[CALL_API] property must be a plain JavaScript object'),
    '[CALL_API] property must be a plain JavaScript object (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action3),
    '[CALL_API] property must be a plain JavaScript object (isValidRSAA)'
  );

  const action4 = {
    [CALL_API]: { invalidKey: '' }
  };
  t.ok(
    validateRSAA(action4).includes('Invalid [CALL_API] key: invalidKey'),
    '[CALL_API] must not have properties other than endpoint, method, types, body, headers, credentials, and bailout (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action4),
    '[CALL_API] must not have properties other than endpoint, method, types, body, headers, credentials, and bailout (isValidRSAA)'
  );

  const action5 = {
    [CALL_API]: {}
  };
  t.ok(
    validateRSAA(action5).includes(
      '[CALL_API] must have an endpoint property',
      '[CALL_API] must have a method property',
      '[CALL_API] must have a types property'
    ),
    '[CALL_API] must have endpoint, method, and types properties (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action5),
    '[CALL_API] must have endpoint, method, and types properties (isValidRSAA)'
  );

  const action6 = {
    [CALL_API]: {
      endpoint: {},
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action6).includes('[CALL_API].endpoint property must be a string or a function'),
    '[CALL_API].endpoint must be a string or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action6),
    '[CALL_API].endpoint must be a string or a function (isValidRSAA)'
  );

  const action7 = {
    [CALL_API]: {
      endpoint: '',
      method: {},
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action7).includes('[CALL_API].method property must be a string'),
    '[CALL_API].method property must be a string (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action7),
    '[CALL_API].method property must be a string (isValidRSAA)'
  );

  const action8 = {
    [CALL_API]: {
      endpoint: '',
      method: 'InvalidMethod',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action8).includes('Invalid [CALL_API].method: INVALIDMETHOD'),
    '[CALL_API].method must be one of the strings \'GET\', \'HEAD\', \'POST\', \'PUT\', \'PATCH\' \'DELETE\', or \'OPTIONS\' (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action8),
    '[CALL_API].method must be one of the strings \'GET\', \'HEAD\', \'POST\', \'PUT\', \'PATCH\' \'DELETE\', or \'OPTIONS\' (isValidRSAA)'
  );

  const action9 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: ''
    }
  };
  t.ok(
    validateRSAA(action9).includes('[CALL_API].headers property must be undefined, a plain JavaScript object, or a function'),
    '[CALL_API].headers property must be undefined, a plain JavaScript object, or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action9),
    '[CALL_API].headers property must be undefined, a plain JavaScript object, or a function (isValidRSAA)'
  );

  const action10 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      credentials: {}
    }
  };
  t.ok(
    validateRSAA(action10).includes('[CALL_API].credentials property must be undefined, or a string'),
    '[CALL_API].credentials property must be undefined or a string (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action10),
    '[CALL_API].credentials property must be undefined or a string (isValidRSAA)'
  );

  const action11 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      credentials: 'InvalidCredentials'
    }
  };
  t.ok(
    validateRSAA(action11).includes('Invalid [CALL_API].credentials: InvalidCredentials'),
    '[CALL_API].credentials property must be one of the string \'omit\', \'same-origin\', or \'include\' (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action11),
    '[CALL_API].credentials property must be one of the string \'omit\', \'same-origin\', or \'include\' (isValidRSAA)'
  );

  const action12 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: ''
    }
  };
  t.ok(
    validateRSAA(action12).includes('[CALL_API].bailout property must be undefined, a boolean, or a function'),
    '[CALL_API].bailout must be undefined, a boolean, or a function (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action12),
    '[CALL_API].bailout must be undefined, a boolean, or a function (isValidRSAA)'
  );

  const action13 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: {}
    }
  };
  t.ok(
    validateRSAA(action13).includes('[CALL_API].types property must be an array of length 3'),
    '[CALL_API].types property must be an array (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action13),
    '[CALL_API].types property must be an array (isRSAA)'
  )

  const action14 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['a', 'b']
    }
  };
  t.ok(
    validateRSAA(action14).includes('[CALL_API].types property must be an array of length 3'),
    '[CALL_API].types property must have length 3 (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action14),
    '[CALL_API].types property must have length 3 (isRSAA)'
  )

  const action15 = {
    [CALL_API]: {
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
    'Each element in [CALL_API].types property must be a string, a symbol, or a type descriptor (validateRSAA)'
  );
  t.notOk(
    isValidRSAA(action15),
    'Each element in [CALL_API].types property must be a string, a symbol, or a type descriptor (isRSAA)'
  )

  const action16 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.equal(
    validateRSAA(action16).length,
    0,
    '[CALL_API].endpoint may be a string (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action16),
    '[CALL_API].endpoint may be a string (isValidRSAA)'
  )

  const action17 = {
    [CALL_API]: {
      endpoint: () => '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.equal(
    validateRSAA(action17).length,
    0,
    '[CALL_API].endpoint may be a function (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action17),
    '[CALL_API].endpoint may be a function (isValidRSAA)'
  );

  const action18 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: {}
    }
  };
  t.equal(
    validateRSAA(action18).length,
    0,
    '[CALL_API].headers may be a plain JavaScript object (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action18),
    '[CALL_API].headers may be a plain JavaScript object (isRSAA)'
  );

  const action19 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: () => {}
    }
  };
  t.equal(
    validateRSAA(action19).length,
    0,
    '[CALL_API].headers may be a function (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action19),
    '[CALL_API].headers may be a function (isRSAA)'
  );

  const action20 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: false
    }
  };
  t.equal(
    validateRSAA(action20).length,
    0,
    '[CALL_API].bailout may be a boolean (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action20),
    '[CALL_API].bailout may be a boolean (isRSAA)'
  );

  const action21 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: () => false
    }
  };
  t.equal(
    validateRSAA(action21).length,
    0,
    '[CALL_API].bailout may be a function (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action21),
    '[CALL_API].bailout may be a function (isRSAA)'
  );

  const action22 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: [Symbol(), Symbol(), Symbol()]
    }
  };
  t.equal(
    validateRSAA(action22).length,
    0,
    'Each element in [CALL_API].types may be a symbol (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action22),
    'Each element in [CALL_API].types may be a symbol (isRSAA)'
  );

  const action23 = {
    [CALL_API]: {
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
    'Each element in [CALL_API].types may be a type descriptor (validateRSAA)'
  );
  t.ok(
    isValidRSAA(action23),
    'Each element in [CALL_API].types may be a type descriptor (isRSAA)'
  );

  t.end();
});

test('InvalidRSAA', (t) => {
  const validationErrors = ['validation error 1', 'validation error 2'];
  const error = new InvalidRSAA(validationErrors);

  t.ok(
    error instanceof Error,
    'is an error object'
  );
  t.equal(
    error.name,
    'InvalidRSAA',
    'has correct name property'
  );
  t.equal(
    error.message,
    'Invalid RSAA',
    'has correct message'
  );
  t.deepEqual(
    error.validationErrors,
    validationErrors,
    'has correct validationErrors property'
  );

  t.end();
});

test('InternalError', (t) => {
  const error = new InternalError('error thrown in payload function');

  t.ok(
    error instanceof Error,
    'is an error object'
  );
  t.equal(
    error.name,
    'InternalError',
    'has correct name property'
  );
  t.equal(
    error.message,
    'error thrown in payload function',
    'has correct message'
  );

  t.end();
});

test('RequestError', (t) => {
  const error = new RequestError('Network request failed');

  t.ok(
    error instanceof Error,
    'is an error object'
  );
  t.equal(
    error.name,
    'RequestError',
    'has correct name property'
  );
  t.equal(
    error.message,
    'Network request failed',
    'has correct message'
  );

  t.end();
});

test('ApiError', (t) => {
  const json = { error: 'Resource not found' };
  const error = new ApiError(404, 'Not Found', json);

  t.ok(
    error instanceof Error,
    'is an error object'
  );
  t.equal(
    error.name,
    'ApiError',
    'has correct name property'
  );
  t.equal(
    error.message,
    '404 - Not Found',
    'has correct message'
  );
  t.equal(
    error.status,
    404,
    'has correct status property'
  );
  t.equal(
    error.statusText,
    'Not Found',
    'has correct statusText property'
  );
  t.equal(
    error.response,
    json,
    'has correct response property'
  );

  t.end();
});

test('getJSON', async (t) => {
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
    'returns the JSON body of a response with a JSONy \'Content-Type\' header'
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
    t.pass('returns a rejected promise for a response with a not-JSONy \'Content-Type\' header');
  }

  t.end();
});

test('normalizeTypeDescriptors', (t) => {
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

test('actionWith', async (t) => {
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
      t.deepEqual(
        args,
        passedArgs,
        'meta function must receive its arguments'
      );
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

test('apiMiddleware must be a Redux middleware', (t) => {
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = () => {};
  const actionHandler = nextHandler(doNext);

  t.equal(
    apiMiddleware.length,
    1,
    'apiMiddleware must take one argument'
  );

  t.equal(
    typeof nextHandler,
    'function',
    'apiMiddleware must return a function to handle next'
  );

  t.equal(
    nextHandler.length,
    1,
    'next handler must take one argument'
  );

  t.equal(
    typeof actionHandler,
    'function',
    'next handler must return a function to handle action'
  );

  t.equal(
    actionHandler.length,
    1,
    'action handler must take one argument'
  );

  t.end();
});

test('apiMiddleware must pass actions without a [CALL_API] property to the next handler', (t) => {
  const anAction = {};
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      anAction,
      action,
      'original action passed to the next handler'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(2);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA for an invalid RSAA with a string request type', (t) => {
  const anAction = {
    [CALL_API]: {
      types: ['REQUEST']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      action.type,
      'REQUEST',
      'dispatched FSA has correct type property'
    );
    t.equal(
      action.payload.name,
      'InvalidRSAA',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      undefined,
      'dispatched FSA has no meta property'
    );
    t.ok(
      action.error,
      'dispatched FSA has correct error property'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA for an invalid RSAA with a descriptor request type', (t) => {
  const anAction = {
    [CALL_API]: {
      types: [
        {
          type: 'REQUEST'
        }
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      action.type,
      'REQUEST',
      'dispatched FSA has correct type property'
    );
    t.equal(
      action.payload.name,
      'InvalidRSAA',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      undefined,
      'dispatched FSA has no meta property'
    );
    t.ok(
      action.error,
      'dispatched FSA has correct error property'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must do nothing for an invalid RSAA without a request type', (t) => {
  const anAction = {
    [CALL_API]: {}
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  actionHandler(anAction);
  setTimeout(() => {
    t.pass('next handler not called');
    t.end();
  }, 200);
});

test('apiMiddleware must dispatch an error request FSA when [CALL_API].bailout fails', (t) => {
  const anAction = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      bailout: () => { throw new Error(); },
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
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      action.type,
      'REQUEST',
      'dispatched FSA has correct type property'
    );
    t.equal(
      action.payload.message,
      '[CALL_API].bailout function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(
      action.error,
      'dispatched FSA has correct error property'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [CALL_API].endpoint fails', (t) => {
  const anAction = {
    [CALL_API]: {
      endpoint: () => { throw new Error(); },
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
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      action.type,
      'REQUEST',
      'dispatched FSA has correct type property'
    );
    t.equal(
      action.payload.message,
      '[CALL_API].endpoint function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(
      action.error,
      'dispatched FSA has correct error property'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA when [CALL_API].headers fails', (t) => {
  const anAction = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      headers: () => { throw new Error(); },
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
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(
      action.type,
      'REQUEST',
      'dispatched FSA has correct type property'
    );
    t.equal(
      action.payload.message,
      '[CALL_API].headers function failed',
      'dispatched FSA has correct payload property'
    );
    t.equal(
      action.meta,
      'someMeta',
      'dispatched FSA has correct meta property'
    );
    t.ok(
      action.error,
      'dispatched FSA has correct error property'
    );
  };
  const actionHandler = nextHandler(doNext);

  t.plan(5);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch an error request FSA on a request error', (t) => {
  const anAction = {
    [CALL_API]: {
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
  const doNext = (action) => {
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
        t.ok(
          action.error,
          'dispatched error FSA has correct error property'
        );
      }
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(10);
  actionHandler(anAction);
});

test('apiMiddleware must use a [CALL_API].bailout boolean when present', (t) => {
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: true
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  actionHandler(anAction);
  setTimeout(() => {
    t.pass('next handler not called');
    t.end();
  }, 200);
});

test('apiMiddleware must use a [CALL_API].bailout function when present', (t) => {
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: () => {
        t.pass('[CALL_API].bailout function called');
        return true;
      }
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.fail('next handler called');
  };
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [CALL_API].endpoint function when present', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200);
  const anAction = {
    [CALL_API]: {
      endpoint: () => {
        t.pass('[CALL_API].endpoint function called');
        return 'http://127.0.0.1/api/users/1';
      },
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an [CALL_API].headers function when present', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200);
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      headers: () => {
        t.pass('[CALL_API].headers function called')
      },
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {};
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with a non-empty JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, { username: 'Alice' }, { 'Content-Type': 'application/json' });
  const anAction = {
    [CALL_API]: {
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
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.notOk(
        action.error,
        'success FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with an empty JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, {}, { 'Content-Type': 'application/json' });
  const anAction = {
    [CALL_API]: {
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
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.notOk(
        action.error,
        'success FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a success FSA on a successful API call with a non-JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200);
  const anAction = {
    [CALL_API]: {
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
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.notOk(
        action.error,
        'success FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});


test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with a non-empty JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(404, { error: 'Resource not found' }, { 'Content-Type': 'application/json' });
  const anAction = {
    [CALL_API]: {
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
        },
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.ok(
        action.error,
        'failure FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with an empty JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(404, {}, { 'Content-Type': 'application/json' });
  const anAction = {
    [CALL_API]: {
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
        },
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.ok(
        action.error,
        'failure FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});

test('apiMiddleware must dispatch a failure FSA on an unsuccessful API call with a non-JSON response', (t) => {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(404);
  const anAction = {
    [CALL_API]: {
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
        },
      ]
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
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
      t.notOk(
        action.error,
        'request FSA has correct error property'
      );
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
      t.ok(
        action.error,
        'failure FSA has correct error property'
      );
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(8);
  actionHandler(anAction);
});
