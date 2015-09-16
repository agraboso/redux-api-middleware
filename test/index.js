import test from 'tape';
import { Schema, arrayOf } from 'normalizr';
import nock from 'nock';

import { CALL_API, apiMiddleware, isRSAA } from '../src';

test('isRSAA must identify RSAA-compliant actions', function (t) {
  t.notOk(isRSAA(''), 'RSAA actions must be plain JavaScript objects');
  t.notOk(isRSAA({}), 'RSAA actions must have an [API_CALL] property');
  t.notOk(isRSAA({ invalidKey: '' }), 'RSAA actions must not have properties other than [API_CALL], payload and meta');
  t.notOk(isRSAA({
    [CALL_API]: ''
  }), '[CALL_API] must be a plain JavaScript object');
  t.notOk(isRSAA({
    [CALL_API]: { invalidKey: '' }
  }), '[CALL_API] must not have properties other than endpoint, method, body, headers, schema, types and bailout');
  t.notOk(isRSAA({
    [CALL_API]: {}
  }), '[CALL_API] must have an endpoint property');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: {}
    }
  }), '[CALL_API].endpoint must be a string or a function');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: ''
    }
  }), '[CALL_API].method must be one of the strings \'GET\', \'HEAD\', \'POST\', \'PUT\', \'PATCH\' \'DELETE\' or \'OPTIONS\'');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ''
    }
  }), '[CALL_API].types must be an array');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['', '']
    }
  }), '[CALL_API].types must have length 3');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: ''
    }
  }), '[CALL_API].headers must be a plain JavaScript object');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: {},
      schema: ''
    }
  }), '[CALL_API].schema must be a normalizr schema');
  t.notOk(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: {},
      schema: new Schema('key'),
      bailout: ''
    }
  }), '[CALL_API].bailout must be a boolean or a function');
  t.ok(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: {},
      schema: new Schema('key'),
      bailout: false
    }
  }), 'isRSAA must return true for an RSAA action (1)');
  t.ok(isRSAA({
    [CALL_API]: {
      endpoint: '',
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: {},
      schema: new Schema('key'),
      bailout: (() => false)
    }
  }), 'isRSAA must return true for an RSAA action (2)');
  t.ok(isRSAA({
    [CALL_API]: {
      endpoint: (() => ''),
      method: 'GET',
      types: ['REQUEST', 'SUCCESS', 'FAILURE'],
      body: {},
      headers: {},
      schema: new Schema('key'),
      bailout: false
    }
  }), 'isRSAA must return true for an RSAA action (3)');

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

test('apiMiddleware must handle an unsuccessful API request that returns a non-json response', function (t) {
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

test('apiMiddleware must process a successful API response with a schema when present', function (t) {
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
      schema: userSchema
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

test('apiMiddleware must use a bailout function when present', function (t) {
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
