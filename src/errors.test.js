// Public package exports
import {
  InvalidRSAA,
  InternalError,
  RequestError,
  ApiError
} from 'redux-api-middleware';

describe('InvalidRSAA', () => {
  const validationErrors = ['validation error 1', 'validation error 2'];
  const error = new InvalidRSAA(validationErrors);

  it('is an error object', () => {
    expect(error).toBeInstanceOf(Error);
  });

  it('matches snapshot', () => {
    expect(error).toMatchSnapshot();
    expect(Object.entries(error)).toMatchSnapshot('object.entries');
  });
});

describe('InternalError', () => {
  const error = new InternalError('error thrown in payload function');

  it('is an error object', () => {
    expect(error).toBeInstanceOf(Error);
  });

  it('matches snapshot', () => {
    expect(error).toMatchSnapshot();
    expect(Object.entries(error)).toMatchSnapshot('object.entries');
  });
});

describe('RequestError', () => {
  const error = new RequestError('Network request failed');

  it('is an error object', () => {
    expect(error).toBeInstanceOf(Error);
  });

  it('matches snapshot', () => {
    expect(error).toMatchSnapshot();
    expect(Object.entries(error)).toMatchSnapshot('object.entries');
  });
});

describe('ApiError', () => {
  const json = { error: 'Resource not found' };
  const error = new ApiError(404, 'Not Found', json);

  it('is an error object', () => {
    expect(error).toBeInstanceOf(Error);
  });

  it('matches snapshot', () => {
    expect(error).toMatchSnapshot();
    expect(Object.entries(error)).toMatchSnapshot('object.entries');
  });
});
