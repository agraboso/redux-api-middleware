/**
 * Error class for an RSAA that does not conform to the RSAA definition
 *
 * @class InvalidRSAA
 * @access public
 * @param {array} validationErrors - an array of validation errors
 */
class InvalidRSAA extends Error {
  constructor(validationErrors) {
    super();
    this.name = 'InvalidRSAA';
    this.message = 'Invalid RSAA';
    this.validationErrors = validationErrors;
  }
}

/**
 * Error class for a custom `payload` or `meta` function throwing
 *
 * @class InternalError
 * @access public
 * @param {string} message - the error message
 */
class InternalError extends Error {
  constructor(message) {
    super();
    this.name = 'InternalError';
    this.message = message;
  }
}

/**
 * Error class for an error raised trying to make an API call
 *
 * @class RequestError
 * @access public
 * @param {string} message - the error message
 */
class RequestError extends Error {
  constructor(message) {
    super();
    this.name = 'RequestError';
    this.message = message;
  }
}

/**
 * Error class for an API response outside the 200 range
 *
 * @class ApiError
 * @access public
 * @param {number} status - the status code of the API response
 * @param {string} statusText - the status text of the API response
 * @param {object} response - the parsed JSON response of the API server if the
 *  'Content-Type' header signals a JSON response
 */
class ApiError extends Error {
  constructor(status, statusText, response) {
    super();
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.message = `${status} - ${statusText}`;
  }
}

export { InvalidRSAA, InternalError, RequestError, ApiError };
