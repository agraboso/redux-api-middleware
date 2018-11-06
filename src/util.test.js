// Public package exports
import { RSAA, getJSON } from './index.js';

// Private package import
import { normalizeTypeDescriptors, actionWith } from './util';

describe('#normalizeTypeDescriptors', () => {
  it('handles string types', () => {
    const types = ['REQUEST', 'SUCCESS', 'FAILURE'];
    const descriptors = normalizeTypeDescriptors(types);
    expect(descriptors).toMatchSnapshot();
  });

  it('handles object types', () => {
    const types = [
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
    const descriptors = normalizeTypeDescriptors(types);
    expect(descriptors).toMatchSnapshot();
  });
});

describe('#actionWith', () => {
  it('handles string payload and meta descriptor properties', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      payload: 'somePayload',
      meta: 'someMeta',
      error: true
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles function payload and meta descriptor properties', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      payload: () => 'somePayloadFromFn',
      meta: () => 'someMetaFromFn'
    });
    expect(fsa).toMatchSnapshot();
  });

  it('passes function payload and meta descriptor properties arguments', async () => {
    const payload = jest.fn();
    payload.mockReturnValue('somePayloadFromMock');
    const meta = jest.fn();
    meta.mockReturnValue('someMetaFromMock');

    const passedArgs = ['action', 'state', 'res'];
    const fsa = await actionWith(
      {
        type: 'REQUEST',
        payload,
        meta
      },
      passedArgs
    );

    expect(payload).toHaveBeenCalledWith(...passedArgs);
    expect(meta).toHaveBeenCalledWith(...passedArgs);
  });

  it('handles an error in the payload function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      payload: () => {
        throw new Error('test error in payload function');
      }
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles an error in the meta function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      meta: () => {
        throw new Error('test error in meta function');
      }
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles a synchronous payload function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      payload: () => 'somePayload'
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles an asynchronous payload function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      payload: new Promise(resolve =>
        setTimeout(() => resolve('somePayloadAsync'), 250)
      )
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles a synchronous meta function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      meta: () => 'someMeta'
    });

    expect(fsa).toMatchSnapshot();
  });

  it('handles an asynchronous meta function', async () => {
    const fsa = await actionWith({
      type: 'REQUEST',
      meta: new Promise(resolve =>
        setTimeout(() => resolve('someMetaAsync'), 250)
      )
    });

    expect(fsa).toMatchSnapshot();
  });
});

describe('#getJSON', () => {
  it("returns the JSON body of a response with a JSONy 'Content-Type' header", async () => {
    const res = {
      headers: {
        get(name) {
          return name === 'Content-Type' ? 'application/json' : undefined;
        }
      },
      json() {
        return Promise.resolve({ message: 'ok' });
      }
    };

    const result = await getJSON(res);
    expect(result).toMatchSnapshot();
  });

  it("returns a resolved promise for a response with a not-JSONy 'Content-Type' header", async () => {
    const res = {
      headers: {
        get(name) {
          return name === 'Content-Type' ? 'not it' : undefined;
        }
      }
    };
    const result = await getJSON(res);
    expect(result).toBeUndefined();
  });
});
