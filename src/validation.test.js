// Public package exports
import { RSAA, isRSAA, validateRSAA, isValidRSAA } from 'redux-api-middleware';

// Private package import
import { isValidTypeDescriptor } from './validation';

describe('#isValidTypeDescriptor', () => {
  it('must be a plain JavaScript object', () => {
    var descriptor = '';
    expect(isValidTypeDescriptor(descriptor)).toBeFalsy();
  });

  it('must not have properties other than type, payload and meta', () => {
    var descriptor = {
      type: '',
      invalidKey: ''
    };
    expect(isValidTypeDescriptor(descriptor)).toBeFalsy();
  });

  it('must have a type property', () => {
    var descriptor = {};
    expect(isValidTypeDescriptor(descriptor)).toBeFalsy();
  });

  it('must not have a type property that is not a string or a symbol', () => {
    var descriptor = {
      type: {}
    };
    expect(isValidTypeDescriptor(descriptor)).toBeFalsy();
  });

  it('may have a type property that is a string', () => {
    var descriptor = {
      type: ''
    };
    expect(isValidTypeDescriptor(descriptor)).toBeTruthy();
  });

  it('may have a type property that is a symbol', () => {
    var descriptor = {
      type: Symbol()
    };
    expect(isValidTypeDescriptor(descriptor)).toBeTruthy();
  });
});

describe('#isRSAA', () => {
  it('RSAAs must be plain JavaScript objects', () => {
    expect(isRSAA('')).toBeFalsy();
  });

  it('RSAAs must have an [RSAA] property', () => {
    expect(isRSAA({})).toBeFalsy();
  });

  it('returns true for an RSAA', () => {
    expect(isRSAA({ [RSAA]: {} })).toBeTruthy();
  });
});

describe('#validateRSAA / #isValidRSAA', () => {
  it('handles invalid actions', () => {
    expect(isValidRSAA('')).toBeFalsy();
    expect(validateRSAA('')).toMatchSnapshot();
  });

  it('handles invalid RSAA value (string)', () => {
    const action = {
      [RSAA]: ''
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid RSAA value (invalid object)', () => {
    const action = {
      [RSAA]: { invalidKey: '' }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles missing RSAA properties', () => {
    const action = {
      [RSAA]: {}
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].endpoint property', () => {
    const action = {
      [RSAA]: {
        endpoint: {},
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].method property (object)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: {},
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].method property (invalid string)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'INVALID_METHOD',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].headers property', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        headers: ''
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].credentials property (object)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        credentials: {}
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].credentials property (invalid string)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        credentials: 'InvalidCredentials'
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].bailout property', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        bailout: ''
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].types property (object)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: {}
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].types property (wrong length)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['a', 'b']
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].types property (invalid objects)', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: [{}, {}, {}]
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].options property', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        options: ''
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].fetch property', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        fetch: {}
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles invalid [RSAA].ok property', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        ok: {}
      }
    };

    expect(isValidRSAA(action)).toBeFalsy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with endpoint string', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with endpoint function', () => {
    const action = {
      [RSAA]: {
        endpoint: () => '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with headers object', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        headers: {}
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with headers function', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        headers: () => ({})
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with bailout boolean', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        bailout: false
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with bailout function', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        bailout: () => false
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with types of symbols', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: [Symbol(), Symbol(), Symbol()]
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with types of type descriptors', () => {
    const action = {
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

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with options object', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        options: {}
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with options function', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        options: () => ({})
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles valid RSAA with fetch function', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE'],
        fetch: () => {}
      }
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles top-level string properties other than RSAA', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      },
      anotherKey: 'foo'
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });

  it('handles top-level symbol properties other than RSAA', () => {
    const action = {
      [RSAA]: {
        endpoint: '',
        method: 'GET',
        types: ['REQUEST', 'SUCCESS', 'FAILURE']
      },
      [Symbol('action30 Symbol')]: 'foo'
    };

    expect(isValidRSAA(action)).toBeTruthy();
    expect(validateRSAA(action)).toMatchSnapshot();
  });
});
