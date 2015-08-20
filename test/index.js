import test from 'tape';
import { Schema } from 'normalizr';

import { CALL_API, apiMiddleware, isRSAA} from '../src';

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
  }), '[CALL_API].method must be one of the strings \'GET\', \'POST\', \'PUT\' and \'DELETE\'');
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
      body: ''
    }
  }), '[CALL_API].body must be a plain JavaScript object');
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

  const doDispatch = () => {};
  const nextHandler = apiMiddleware({ dispatch: doDispatch });

  t.ok(typeof nextHandler === 'function', 'apiMiddleware must return a function to handle next');
  t.equal(nextHandler.length, 1, 'next handler must take one argument');

  const doNext = () => {};
  const actionHandler = nextHandler({ next: doNext });

  t.ok(typeof actionHandler === 'function', 'next handler must return a function to handle action');
  t.equal(actionHandler.length, 1, 'action handler must take one argument');

  t.end();
});
