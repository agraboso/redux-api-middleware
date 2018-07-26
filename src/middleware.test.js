// Public package exports
import {
  RSAA,
  apiMiddleware,
  createMiddleware,
  InternalError
} from 'redux-api-middleware';

const fetchMockSnapshotMatcher = {
  invocationCallOrder: expect.any(Object)
};
// const fetchMockSnapshotMatcher = {};

const doTestMiddleware = async ({ response, action }) => {
  if (response) {
    const { body, ...mockConfig } = response;
    fetch.mockResponseOnce(body, mockConfig);
  }

  const doGetState = jest.fn();
  doGetState.mockImplementation(() => {});
  const doNext = jest.fn();
  doNext.mockImplementation(it => it);

  const nextHandler = apiMiddleware({ getState: doGetState });
  const actionHandler = nextHandler(doNext);
  const result = actionHandler(action);

  if (result) {
    const final = await result;
    if (final) {
      expect(final).toMatchSnapshot({}, 'final result');
    }
  }

  if (doNext.mock.calls.length) {
    expect(doNext).toMatchSnapshot({}, 'next mock');
  }

  if (fetch.mock.calls.length) {
    expect(fetch.mock).toMatchSnapshot(
      {
        invocationCallOrder: expect.any(Object)
      },
      'fetch mock'
    );
  }

  return {
    doGetState,
    nextHandler,
    doNext,
    actionHandler,
    result
  };
};

describe('#createMiddleware', () => {
  it('returns a redux middleware', () => {
    const doGetState = () => {};
    const middleware = createMiddleware();
    const nextHandler = middleware({ getState: doGetState });
    const doNext = () => {};
    const actionHandler = nextHandler(doNext);

    expect(typeof middleware).toEqual('function');
    expect(middleware).toHaveLength(1);

    expect(typeof nextHandler).toEqual('function');
    expect(nextHandler).toHaveLength(1);

    expect(typeof actionHandler).toEqual('function');
    expect(actionHandler).toHaveLength(1);
  });
});

describe('#apiMiddleware', () => {
  it('is a redux middleware', () => {
    const doGetState = () => {};
    const nextHandler = apiMiddleware({ getState: doGetState });
    const doNext = () => {};
    const actionHandler = nextHandler(doNext);

    expect(typeof apiMiddleware).toEqual('function');
    expect(apiMiddleware).toHaveLength(1);

    expect(typeof nextHandler).toEqual('function');
    expect(nextHandler).toHaveLength(1);

    expect(typeof actionHandler).toEqual('function');
    expect(actionHandler).toHaveLength(1);
  });

  it('must pass actions without an [RSAA] property to the next handler', async () => {
    const action = {};

    const { doNext } = await doTestMiddleware({
      action
    });
    expect(doNext).toHaveBeenCalledWith(action);
  });

  it("mustn't return a promise on actions without a [RSAA] property", async () => {
    const action = {};

    const { result } = await doTestMiddleware({
      action
    });

    expect(result.then).toBeUndefined();
  });

  it('must return a promise on actions without a [RSAA] property', async () => {
    const action = { [RSAA]: {} };

    const { result } = await doTestMiddleware({
      action
    });

    expect(typeof result.then).toEqual('function');
  });

  it('must dispatch an error request FSA for an invalid RSAA with a string request type', async () => {
    const action = {
      [RSAA]: {
        types: ['REQUEST']
      }
    };

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA for an invalid RSAA with a descriptor request type', async () => {
    const action = {
      [RSAA]: {
        types: [
          {
            type: 'REQUEST'
          }
        ]
      }
    };

    await doTestMiddleware({
      action
    });
  });

  it('must do nothing for an invalid RSAA without a request type', async () => {
    const action = {
      [RSAA]: {}
    };

    const { doNext } = await doTestMiddleware({
      action
    });

    expect(doNext).not.toHaveBeenCalled();
  });

  it('must dispatch an error request FSA when [RSAA].bailout fails', async () => {
    const action = {
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

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA when [RSAA].body fails', async () => {
    const action = {
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

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA when [RSAA].endpoint fails', async () => {
    const action = {
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

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA when [RSAA].headers fails', async () => {
    const action = {
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

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA when [RSAA].options fails', async () => {
    const action = {
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

    await doTestMiddleware({
      action
    });
  });

  it('must dispatch an error request FSA when [RSAA].ok fails', async () => {
    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        ok: () => {
          throw new Error();
        },
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a failure FSA with an error on a request error', async () => {
    fetch.mockRejectOnce(new Error('Test request error'));

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
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

    await doTestMiddleware({
      action
    });
  });

  it('must use an [RSAA].bailout boolean when present', async () => {
    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        bailout: true
      }
    };

    await doTestMiddleware({
      action
    });
  });

  it('must use an [RSAA].bailout function when present', async () => {
    const bailout = jest.fn();
    bailout.mockReturnValue(true);

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        bailout
      }
    };

    const { doNext } = await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(bailout).toMatchSnapshot({}, 'bailout()');
    expect(doNext).not.toHaveBeenCalled();
  });

  it('must use an [RSAA].body function when present', async () => {
    const body = jest.fn();
    body.mockReturnValue('mockBody');

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        body
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(body).toMatchSnapshot({}, 'body()');
  });

  it('must use an [RSAA].endpoint function when present', async () => {
    const endpoint = jest.fn();
    endpoint.mockReturnValue('http://127.0.0.1/api/users/1');

    const action = {
      [RSAA]: {
        endpoint,
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(endpoint).toMatchSnapshot({}, 'endpoint()');
  });

  it('must use an [RSAA].headers function when present', async () => {
    const headers = jest.fn();
    headers.mockReturnValue({ 'Test-Header': 'test' });

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        headers
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(headers).toMatchSnapshot({}, 'headers()');
  });

  it('must use an [RSAA].options function when present', async () => {
    const options = jest.fn();
    options.mockReturnValue({});

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        options
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(options).toMatchSnapshot({}, 'options()');
  });

  it('must use an [RSAA].ok function when present', async () => {
    const ok = jest.fn();
    ok.mockReturnValue(true);

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        ok
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(ok).toMatchSnapshot({}, 'ok()');
  });

  it('must dispatch a failure FSA when [RSAA].ok returns false on a successful request', async () => {
    const ok = jest.fn();
    ok.mockReturnValue(false);

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        ok
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(ok).toMatchSnapshot({}, 'ok()');
  });

  it('must use a [RSAA].fetch custom fetch wrapper when present', async () => {
    const myFetch = async (endpoint, opts) => {
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
    };

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        fetch: myFetch
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({
          id: 1,
          name: 'Alan',
          error: false
        }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch correct error payload when [RSAA].fetch wrapper returns an error response', async () => {
    const myFetch = async (endpoint, opts) => {
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
    };

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        fetch: myFetch
      }
    };

    await doTestMiddleware({
      action
    });
  });

  it('must use payload property of request type descriptor when it is a function', async () => {
    const payload = jest.fn();
    payload.mockReturnValue('requestPayload');

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: [
          {
            type: 'REQUEST',
            meta: 'requestMeta',
            payload
          },
          'SUCCESS',
          'FAILURE'
        ]
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(payload).toMatchSnapshot({}, 'payload()');
  });

  it('must use meta property of request type descriptor when it is a function', async () => {
    const meta = jest.fn();
    meta.mockReturnValue('requestMeta');

    const action = {
      [RSAA]: {
        endpoint: 'http://127.0.0.1/api/users/1',
        method: 'GET',
        types: [
          {
            type: 'REQUEST',
            meta,
            payload: 'requestPayload'
          },
          'SUCCESS',
          'FAILURE'
        ]
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ data: '12345' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    expect(meta).toMatchSnapshot({}, 'meta()');
  });

  it('must dispatch a success FSA on a successful API call with a non-empty JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ username: 'Alice' }),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a success FSA on a successful API call with an empty JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({}),
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a success FSA with an error state on a successful API call with an invalid JSON response', async () => {
    const action = {
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
              throw new InternalError(
                'Expected error - simulating invalid JSON'
              );
            }
          },
          'FAILURE'
        ]
      }
    };

    await doTestMiddleware({
      action,
      response: {
        body: '',
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a success FSA on a successful API call with a non-JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: null,
        status: 200
      }
    });
  });

  it('must dispatch a failure FSA on an unsuccessful API call with a non-empty JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({ error: 'Resource not found' }),
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a failure FSA on an unsuccessful API call with an empty JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: JSON.stringify({}),
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
  });

  it('must dispatch a failure FSA on an unsuccessful API call with a non-JSON response', async () => {
    const action = {
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

    await doTestMiddleware({
      action,
      response: {
        body: '',
        status: 404
      }
    });
  });
});
