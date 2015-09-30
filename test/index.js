import test from 'tape';
import { Schema, normalize, arrayOf } from 'normalizr';
import nock from 'nock';

import { CALL_API, apiMiddleware, validateRSAA, isRSAA } from '../src';

test('validateRSAA/isRSAA must identify RSAA-compliant actions', function (t) {
  var action1 = '';
  t.ok(
    validateRSAA(action1).length === 1 &&
    validateRSAA(action1).includes('RSAA must be a plain JavaScript object'),
    'RSAA actions must be plain JavaScript objects (validateRSAA)'
  );
  t.notOk(
    isRSAA(action1),
    'RSAA actions must be plain JavaScript objects (isRSAA)'
  );

  var action2 = {};
  t.ok(
    validateRSAA(action2).length === 1 &&
    validateRSAA(action2).includes('Missing [CALL_API] key'),
   'RSAA actions must have a [CALL_API] property (validateRSAA)'
  );
  t.notOk(
    isRSAA(action2),
    'RSAA actions must have a [CALL_API] property (isRSAA)'
  );

  var action3 = {
    [CALL_API]: {},
    invalidKey: ''
  };
  t.ok(
    validateRSAA(action3).length === 1 &&
    validateRSAA(action3).includes('Invalid root key: invalidKey'),
    'RSAA actions must not have properties other than [CALL_API], payload and meta (validateRSAA)'
  );
  t.notOk(
    isRSAA(action3),
    'RSAA actions must not have properties other than [CALL_API], payload and meta (isRSAA)'
  );

  var action4 = {
    [CALL_API]: ''
  };
  t.ok(
    validateRSAA(action4).length === 1 &&
    validateRSAA(action4).includes('[CALL_API] property must be a plain JavaScript object'),
    '[CALL_API] must be a plain JavaScript object (validateRSAA)'
  );
  t.notOk(
    isRSAA(action4),
    '[CALL_API] must be a plain JavaScript object (isRSAA)'
  );

  var action5 = {
    [CALL_API]: { invalidKey: '' }
  };
  t.ok(
    validateRSAA(action5).length === 1 &&
    validateRSAA(action5).includes('Invalid [CALL_API] key: invalidKey'),
    '[CALL_API] must not have properties other than endpoint, method, body, headers, schema, types and bailout (validateRSAA)'
  );
  t.notOk(
    isRSAA(action5),
    '[CALL_API] must not have properties other than endpoint, method, body, headers, schema, types and bailout (isRSAA)'
  );

  var action6 = {
    [CALL_API]: {}
  };
  t.ok(
    validateRSAA(action6).length === 3 &&
    validateRSAA(action6).includes(
      '[CALL_API].endpoint property must be a string or a function',
      '[CALL_API].method property must be a string',
      '[CALL_API].types property must be an array of length 3'
    ),
    '[CALL_API] must have endpoint, method and types properties (validateRSAA)'
  );
  t.notOk(
    isRSAA(action6),
    '[CALL_API] must have endpoint, method and types properties (isRSAA)'
  );

  var action7 = {
    [CALL_API]: {
      endpoint: {},
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action7).includes('[CALL_API].endpoint property must be a string or a function'),
    '[CALL_API].endpoint must be a string or a function (validateRSAA)'
  );
  t.notOk(
    isRSAA(action7),
    '[CALL_API].endpoint must be a string or a function (isRSAA)'
  );

  var action8 = {
    [CALL_API]: {
      endpoint: '',
      method: 'InvalidMethod',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.ok(
    validateRSAA(action8).includes('Invalid [CALL_API].method: INVALIDMETHOD'),
    '[CALL_API].method must be one of the strings \'GET\', \'HEAD\', \'POST\', \'PUT\', \'PATCH\' \'DELETE\' or \'OPTIONS\' (validateRSAA)'
  );
  t.notOk(
    isRSAA(action8),
    '[CALL_API].method must be one of the strings \'GET\', \'HEAD\', \'POST\', \'PUT\', \'PATCH\' \'DELETE\' or \'OPTIONS\' (isRSAA)'
  );

  var action9 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: {}
    }
  };
  t.ok(
    validateRSAA(action9).includes('[CALL_API].types property must be an array of length 3'),
    '[CALL_API].types must be an array (validateRSAA)'
  );
  t.notOk(
    isRSAA(action9),
    '[CALL_API].types must be an array (isRSAA)'
  );

  var action10 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['a', 'b']
    }
  };
  t.ok(
    validateRSAA(action10).includes('[CALL_API].types property must be an array of length 3'),
    '[CALL_API].types must have length 3 (validateRSAA)'
  );
  t.notOk(
    isRSAA(action10),
    '[CALL_API].types must have length 3 (isRSAA)'
  );

  var action11 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: ''
    }
  };
  t.ok(
    validateRSAA(action11).includes('[CALL_API].headers property must be undefined, or a plain JavaScript object'),
    '[CALL_API].headers must be undefined, or a plain JavaScript object (validateRSAA)'
  );
  t.notOk(
    isRSAA(action11),
    '[CALL_API].headers must be undefined, or a plain JavaScript object (isRSAA)'
  );

  var action12 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      transform: ''
    }
  };
  t.ok(
    validateRSAA(action12).includes('[CALL_API].transform property must be undefined, or a function'),
    '[CALL_API].transform property must be undefined, or a function (validateRSAA)'
  );
  t.notOk(
    isRSAA(action12),
    '[CALL_API].transform property must be undefined, or a function (isRSAA)'
  );

  var action13 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: ''
    }
  };
  t.ok(
    validateRSAA(action13).includes('[CALL_API].bailout property must be undefined, a boolean, or a function'),
    '[CALL_API].bailout must be undefined, a boolean or a function (validateRSAA)'
  );
  t.notOk(
    isRSAA(action13),
    '[CALL_API].bailout must be undefined, a boolean or a function (isRSAA)'
  );

  var action14 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.notOk(
    validateRSAA(action14).length,
    '[CALL_API].endpoint may be a string (validateRSAA)'
  );
  t.ok(
    isRSAA(action14),
    '[CALL_API].endpoint may be a string (isRSAA)'
  );

  var action15 = {
    [CALL_API]: {
      endpoint: (() => ''),
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE']
    }
  };
  t.notOk(
    validateRSAA(action15).length,
    '[CALL_API].endpoint may be a function (validateRSAA)'
  );
  t.ok(
    isRSAA(action15),
    '[CALL_API].endpoint may be a function (isRSAA)'
  );

  var action16 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      headers: {}
    }
  };
  t.notOk(
    validateRSAA(action16).length,
    '[CALL_API].headers may be a plain JavaScript object (validateRSAA)'
  );
  t.ok(
    isRSAA(action16),
    '[CALL_API].headers may be a plain JavaScript object (isRSAA)'
  );

  var action17 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      transform: () => {}
    }
  };
  t.notOk(
    validateRSAA(action17).length,
    '[CALL_API].transform may be a function (validateRSAA)'
  );
  t.ok(
    isRSAA(action17),
    '[CALL_API].transform may be a function (isRSAA)'
  );

  var action18 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: false
    }
  };
  t.notOk(
    validateRSAA(action18).length,
    '[CALL_API].bailout may be a boolean (validateRSAA)'
  );
  t.ok(
    isRSAA(action18),
    '[CALL_API].bailout may be a boolean (isRSAA)'
  );

  var action19 = {
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      bailout: (() => false)
    }
  };
  t.notOk(
    validateRSAA(action19).length,
    '[CALL_API].bailout may be a function (validateRSAA)'
  );
  t.ok(
    isRSAA(action19),
    '[CALL_API].bailout may be a function (isRSAA)'
  );

  t.end();
});

test('apiMiddleware must be a Redux middleware', function (t) {
  t.equal(apiMiddleware.length, 1, 'apiMiddleware must take one argument');

  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });

  t.ok(typeof nextHandler === 'function', 'apiMiddleware must return a function to handle next');
  t.equal(nextHandler.length, 1, 'next handler must take one argument');

  const doNext = () => {};
  const actionHandler = nextHandler(doNext);

  t.ok(typeof actionHandler === 'function', 'next handler must return a function to handle action');
  t.equal(actionHandler.length, 1, 'action handler must take one argument');

  t.end();
});

test('apiMiddleware must pass non-RSAA actions to the next handler', function (t) {
  const nonRSAAAction = {};
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    t.pass('next handler called');
    t.equal(nonRSAAAction, action, 'original action was passed to the next handler')
  };
  const actionHandler = nextHandler(doNext);

  t.plan(2);
  actionHandler(nonRSAAAction);
});

test('apiMiddleware must handle an unsuccessful API request with a json response', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(404, { error: 'API error' }, { 'Content-Type': 'application/json' });
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE']
    },
    payload: { someKey: 'someValue' },
    meta: 'meta'
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'FETCH_USER.REQUEST':
      t.pass('request FSA passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'request FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, anAction.payload, 'request FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'request FSA has correct meta property');
      t.notOk(action.error, 'request FSA has correct error property');
      break;
    case 'FETCH_USER.FAILURE':
      t.pass('failure FSA action passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'failure FSA does not have a [CALL_API] property')
      t.equal(action.payload.name, 'ApiError', 'failure FSA has an ApiError payload');
      t.equal(action.payload.status, 404, 'failure FSA has an ApiError payload with the correct status code');
      t.equal(action.payload.statusText, 'Not Found', 'failure FSA has an ApiError payload with the correct status text');
      t.equal(action.payload.message, '404 - Not Found', 'failure FSA has an ApiError payload with the correct message');
      t.equal(action.payload.response.error, 'API error', 'failure FSA has an ApiError payload with the correct json response');
      t.deepEqual(action.meta, anAction.meta, 'failure FSA has correct meta property');
      t.ok(action.error, 'failure FSA has correct error property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(14);
  actionHandler(anAction);
});

test('apiMiddleware must handle an unsuccessful API request with a non-json response', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(404, '<html><body>404 Not Found!</body></html>', { 'Content-Type': 'application/html' });
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE']
    },
    payload: { someKey: 'someValue' },
    meta: 'meta'
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'FETCH_USER.REQUEST':
      t.pass('request FSA passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'request FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, anAction.payload, 'request FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'request FSA has correct meta property');
      t.notOk(action.error, 'request FSA has correct error property');
      break;
    case 'FETCH_USER.FAILURE':
      t.pass('failure FSA action passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'failure FSA does not have a [CALL_API] property')
      t.equal(action.payload.name, 'ApiError', 'failure FSA has an ApiError payload');
      t.equal(action.payload.status, 404, 'failure FSA has an ApiError payload with the correct status code');
      t.equal(action.payload.statusText, 'Not Found', 'failure FSA has an ApiError payload with the correct status text');
      t.equal(action.payload.message, '404 - Not Found', 'failure FSA has an ApiError payload with the correct message');
      t.equal(action.payload.response.constructor.name, 'Response', 'failure FSA has an ApiError payload with the response object');
      t.deepEqual(action.meta, anAction.meta, 'failure FSA has correct meta property');
      t.ok(action.error, 'failure FSA has correct error property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(14);
  actionHandler(anAction);
});

test('apiMiddleware must handle a successful API request', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, { username: 'Alice' }, {'Content-Type': 'application/json'});
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE']
    },
    payload: { someKey: 'someValue' },
    meta: 'meta'
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'FETCH_USER.REQUEST':
      t.pass('request FSA passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'request FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, anAction.payload, 'request FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'request FSA has correct meta property');
      t.notOk(action.error, 'request FSA has correct error property');
      break;
    case 'FETCH_USER.SUCCESS':
      t.pass('success FSA action passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'success FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, { ...anAction.payload, username: 'Alice' }, 'success FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'success FSA has correct meta property');
      t.notOk(action.error, 'success FSA has correct error property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(10);
  actionHandler(anAction);
});

test('apiMiddleware must handle a successful API request that returns an empty body', function (t) {
  const api = nock('http://127.0.0.1')
                .delete('/api/users/1')
                .reply(204);
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'DELETE',
      types: ['DELETE_USER.REQUEST', 'DELETE_USER.SUCCESS', 'DELETE_USER.FAILURE']
    },
    payload: { someKey: 'someValue' },
    meta: 'meta'
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'DELETE_USER.REQUEST':
      t.pass('request FSA passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'request FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, anAction.payload, 'request FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'request FSA has correct meta property');
      t.notOk(action.error, 'request FSA has correct error property');
      break;
    case 'DELETE_USER.SUCCESS':
      t.pass('success FSA action passed to the next handler');
      t.equal(typeof action[CALL_API], 'undefined', 'success FSA does not have a [CALL_API] property')
      t.deepEqual(action.payload, anAction.payload, 'success FSA has correct payload property');
      t.deepEqual(action.meta, anAction.meta, 'success FSA has correct meta property');
      t.notOk(action.error, 'success FSA has correct error property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(10);
  actionHandler(anAction);
});

test('apiMiddleware must process a successful API response with a transform function when present', function (t) {
  const userRecord = {
    id: 1,
    username: 'Alice',
    friends: [{
      id: 2,
      username: 'Bob'
    }]
  };
  const userSchema = new Schema('users');
  userSchema.define({
    friends: arrayOf(userSchema)
  });
  const entities = {
    users : {
      1: {
        id: 1,
        username: 'Alice',
        friends: [2]
      },
      2: {
        id: 2,
        username: 'Bob'
      }
    }
  };

  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, userRecord, {'Content-Type': 'application/json'});
  const anAction = {
    [CALL_API]: {
      endpoint: 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE'],
      transform: (json) => normalize(json, userSchema)
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'FETCH_USER.SUCCESS':
      t.deepEqual(action.payload.entities, entities, 'success FSA has correct payload property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use an endpoint function when present', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, { username: 'Alice' }, {'Content-Type': 'application/json'});
  const anAction = {
    [CALL_API]: {
      endpoint: () => 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE']
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => {
    switch (action.type) {
    case 'FETCH_USER.SUCCESS':
      t.deepEqual(action.payload, { username: 'Alice' }, 'success FSA has correct payload property');
      break;
    }
  };
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction);
});

test('apiMiddleware must use a bailout boolean when present', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, { username: 'Alice' }, {'Content-Type': 'application/json'});
  const anAction = {
    [CALL_API]: {
      endpoint: () => 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE'],
      bailout: true
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => { t.fail(); };
  const actionHandler = nextHandler(doNext);

  t.plan(1);
  actionHandler(anAction).then((message) => { t.equal(message, 'Bailing out', 'bailed out'); });
});

test('apiMiddleware must use a bailout function when present', function (t) {
  const api = nock('http://127.0.0.1')
                .get('/api/users/1')
                .reply(200, { username: 'Alice' }, {'Content-Type': 'application/json'});
  const anAction = {
    [CALL_API]: {
      endpoint: () => 'http://127.0.0.1/api/users/1',
      method: 'GET',
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE'],
      bailout: () => { t.pass('bailout function called'); return true; }
    }
  };
  const doGetState = () => {};
  const nextHandler = apiMiddleware({ getState: doGetState });
  const doNext = (action) => { t.fail(); };
  const actionHandler = nextHandler(doNext);

  t.plan(2);
  actionHandler(anAction).then((message) => { t.equal(message, 'Bailing out', 'bailed out'); });
});
