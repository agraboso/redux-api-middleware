/**
 * Error class for an API response outside the 200 range
 *
 * @class ApiError
 * @access private
 * @param {number} status - the status code of the API response
 * @param {string} statusText - the status text of the API response
 * @param {Object} response - the JSON response of the API server if the 'Content-Type'
 *  header signals a JSON response, or the raw response object otherwise
 */
class ApiError extends Error {
  constructor(status, statusText, response) {
    super();
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.message = `${status} - ${statusText}`;
    this.response = response;
  }
}

export default ApiError;
