redux-api-middleware
====================

[![Build Status](https://travis-ci.org/agraboso/redux-api-middleware.svg?branch=master)](https://travis-ci.org/agraboso/redux-api-middleware) [![Coverage Status](https://coveralls.io/repos/agraboso/redux-api-middleware/badge.svg?branch=master&service=github)](https://coveralls.io/github/agraboso/redux-api-middleware?branch=master)

[Redux middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) for calling an API.

## Table of contents

1. [Introduction](#introduction)
    - [A simple example](#a-simple-example)
2. [Installation](#installation)
3. [Usage](#usage)
    - [Defining the API call](#defining-the-api-call)
    - [Bailing out](#bailing-out)
    - [Lifecycle](#lifecycle)
    - [Customizing the dispatched FSAs](#customizing-the-dispatched-fsas)
4. [Reference](#reference)
    - [Exports](#exports)
    - [Flux Standard Actions](#flux-standard-actions)
    - [Redux Standard API-calling Actions](#redux-standard-api-calling-actions)
5. [History](#history)
6. [Tests](#tests)
7. [License](License)
8. [Acknowledgements](#acknowledgements)

## Introduction

This middleware receives [*Redux Standard API-calling Actions*](#redux-standard-api-calling-actions) (RSAAs) and dispatches [*Flux Standard Actions*](#flux-standard-actions) (FSAs) to the next middleware.

RSAAs are identified by the presence of a `[CALL_API]` property, where [`CALL_API`](#call_api) is a `Symbol` defined in, and exported by `redux-api-middleware`. They contain information describing an API call and three different types of FSAs, known as the *request*, *success* and *failure* FSAs.

### A simple example

The following is a minimal RSAA action:

```js
import { CALL_API } from `redux-api-middleware`;

{
  [CALL_API]: {
    endpoint: 'http://www.example.com/api/users',
    method: 'GET',
    types: ['REQUEST', 'SUCCESS', 'FAILURE']
  }
}
```

Upon receiving this action, `redux-api-middleware` will

1. check that it is indeed a valid RSAA action;
2. dispatch the following *request* FSA to the next middleware;

    ```js
    {
      type: 'REQUEST'
    }
    ```

3. make a GET request to `http://www.example.com/api/users`;
4. if the request is successful, dispatch the following *success* FSA to the next middleware;

    ```js
    {
      type: 'SUCCESS',
      payload: {
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Doe' },
        ]
      }
    }
    ```

5. if the request is unsuccessful, dispatch the following *failure* FSA to the next middleware.

    ```js
    {
      type: 'FAILURE',
      payload: error // An ApiError object
      error: true
    }
    ```

We have tiptoed around error-handling issues here. For a thorough walkthrough of the `redux-api-middleware` lifecycle, see [Lifecycle](#lifecycle) below.

## Installation

`redux-api-middleware` is available on [npm](https://www.npmjs.com/package/redux-api-middleware).

```
$ npm install redux-api-middleware --save
```

To use it, wrap the standard Redux store with it. Here is an example setup. For more information (for example, on how to add several middlewares), consult the [Redux documentation](http://redux.js.org).

#### configureStore.js

```js
import { createStore, applyMiddleware, combineReducers } from 'redux';
import { apiMiddleware } from 'redux-api-middleware';
import reducers from './reducers';

const reducer = combineReducers(reducers);
const createStoreWithMiddleware = applyMiddleware(apiMiddleware)(createStore);

export default function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState);
}
```

#### app.js

```js
const store = configureStore(initialState);
```

## Usage

### Defining the API call

The parameters of the API call are specified by root properties of the `[CALL_API]` property of an RSAA.

#### `[CALL_API].endpoint`

The URL endpoint for the API call.

It is usually a string, be it a plain old one or an ES2015 template string. It may also be a function taking the state of your Redux store as its argument, and returning such a string.

####  `[CALL_API].method`

The HTTP method for the API call.

It must be one of the strings `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` or `OPTIONS`, in any mixture of lowercase and uppercase letters.

#### `[CALL_API].body`

The body of the API call.

`redux-api-middleware` uses [`isomorphic-fetch`](https://github.com/matthew-andrews/isomorphic-fetch) to make the API call. `[CALL_API].body` should hence be a valid body according to the the [fetch specification](https://fetch.spec.whatwg.org). In most cases, this will be a JSON-encoded string or a [`FormData`](https://developer.mozilla.org/en/docs/Web/API/FormData) object.

#### `[CALL_API].headers`

The HTTP headers for the API call.

It is usually an object, with the keys specifying the header names and the values containing their content. For example, you can let the server know your call contains a JSON-encoded string body in the following way.

```js
{
  [CALL_API]: {
    ...
    headers: { 'Content-Type': 'application/json' }
    ...
  }
}
```

It may also be a function taking the state of your Redux store as its argument, and returning an object of headers as above.

#### `[CALL_API].credentials`

Whether or not to send cookies with the API call.

It must be one of the following strings:

- `omit` is the default, and does not send any cookies;
- `same-origin` only sends cookies for the current domain;
- `include` always send cookies, even for cross-origin calls.

### Bailing out

In some cases, the data you would like to fetch from the server may already be cached in your Redux store. Or you may decide that the current user does not have the necessary permissions to make some request.

You can tell `redux-api-middleware` to not make the API call through `[CALL_API].bailout`. If the value is `true`, the RSAA will die here, and no FSA will be passed on to the next middleware.

A more useful possibility is to give `[CALL_API].bailout` a function. At runtime, it will be passed the state of your Redux store as its only argument, if the return value of the function is `true`, the API call will not be made.

### Lifecycle

The `[CALL_API].types` property controls the output of `redux-api-middleware`. The simplest form it can take is an array of length 3 consisting of string constants (or symbols), as in our [example](#a-simple-example) above. This results in the default behavior we now describe.

1. When `redux-api-middleware` receives an action, it first checks whether it has a `[CALL_API]` property. If it does not, it was clearly not intended for processing with `redux-api-middleware`, and so it is unceremoniously passed on to the next middleware.

2. It is now time to validate the action against the [RSAA definition](#redux-standard-api-calling-actions). If there are any validation errors, a *request* FSA will be dispatched (if at all possible) with the following properties:
    - `type`: the string constant in the first position of the `[CALL_API].types` array;
    - `payload`: an [`InvalidRSAA`](#invalidrsaa) object containing a list of said validation errors;
    - `error: true`.

  `redux-api-middleware` will perform no further operations. In particular, no API call will be made, and the incoming RSAA will die here.

3. Now that `redux-api-middleware` is sure it has received a valid RSAA, it will try making the API call. If everything is alright, a *request* FSA will be dispatched with the following property:
  - `type`: the string constant in the first position of the `[CALL_API].types` array.

  But errors may pop up at this stage, for several reasons:
  - `redux-api-middleware` has to call those of `[CALL_API].bailout`, `[CALL_API].endpoint` and `[CALL_API].headers` that happen to be a function, which may throw an error;
  - `isomorphic-fetch` may throw an error: the RSAA definition is not strong enough to preclude that from happening (you may, for example, send in a `[CALL_API].body` that is not valid according to the fetch specification &mdash; mind the SHOULDs in the [RSAA definition](#redux-standard-api-calling-actions));
  - a network failure occurs (the network is unreachable, the server responds with an error,...).

  If such an error occurs, a different *request* FSA will be dispatched (*instead* of the one described above). It will contain the following properties:
  - `type`: the string constant in the first position of the `[CALL_API].types` array;
  - `payload`: a [`RequestError`](#requesterror) object containing an error message;
  - `error: true`.

4. If `redux-api-middleware` receives a response from the server with a status code in the 200 range, a *success* FSA will be dispatched with the following properties:
  - `type`: the string constant in the second position of the `[CALL_API].types` array;
  - `payload`: if the `Content-Type` header of the response is set to something JSONy (see [*Success* type descriptors](#success-type-descriptors) below), the parsed JSON response of the server, or undefined otherwise.

  If the status code of the response falls outside that 200 range, a *failure* FSA will dispatched instead, with the following properties:
  - `type`: the string constant in the third position of the `[CALL_API].types` array;
  - `payload`: an [`ApiError`](#apierror) object containing the message `` `${status} - ${statusText}` ``;
  - `error: true`.

### Customizing the dispatched FSAs

It is possible to customize the output of `redux-api-middleware` by replacing one or more of the string constants (or symbols) in `[CALL_API].types` by a type descriptor.

A *type descriptor* is a plain JavaScript object that will be used as a blueprint for the dispatched FSAs. As such, type descriptors must have a `type` property, intended to house the string constant or symbol specifying the `type` of the resulting FSAs.

They may also have `payload` and `meta` properties, which may be of any type. Functions passed as `payload` and `meta` properties of type descriptors will be evaluated at runtime. The signature of these functions should be different depending on whether the type descriptor refers to *request*, *success* or *failure* FSAs &mdash; keep reading.

If a custom `payload` and `meta` function throws an error, `redux-api-middleware` will dispatch an FSA with its `error` property set to `true`, and an `InternalError` object as its `payload`.

A noteworthy feature of `redux-api-middleware` is that it accepts Promises (or function that return them) in `payload` and `meta` properties of type descriptors, and it will wait for them to resolve before dispatching the FSA &mdash; so no need to use anything like `redux-promise`.

#### *Request* type descriptors

`payload` and `meta` functions will be passed the RSAA action itself and the state of your Redux store.

For example, if you want your *request* FSA to have the URL endpoint of the API call in its `payload` property, you can model your RSAA on the following.

```js
// Input RSAA
{
  [CALL_API]: {
    endpoint: 'http://www.example.com/api/users',
    method: 'GET',
    types: [
      {
        type: 'REQUEST',
        payload: (action, state) => ({ endpoint: action.endpoint })
      },
      'SUCCESS',
      'FAILURE'
    ]
  }
}

// Output request FSA
{
  type: 'REQUEST',
  payload: { endpoint: 'http://www.example.com/api/users' }
}
```

If you do not need access to the action itself or the state of your Redux store, you may as well just use a static object. For example, if you want the `meta` property to contain a fixed message saying where in your application you're making the request, you can do this.

```js
// Input RSAA
{
  [CALL_API]: {
    endpoint: 'http://www.example.com/api/users',
    method: 'GET',
    types: [
      {
        type: 'REQUEST',
        meta: { source: 'userList' }
      },
      'SUCCESS',
      'FAILURE'
    ]
  }
}

// Output request FSA
{
  type: 'REQUEST',
  meta: { source: 'userList' }
}
```

By default, *request* FSAs will not contain `payload` and `meta` properties.

Error *request* FSAs might need to obviate these custom settings though.
  - *Request* FSAs resulting from invalid RSAAs (step 2 in [Lifecycle](#lifecycle) above) cannot be customized. `redux-api-middleware` will try to dispatch an error *request* FSA, but it might not be able to (it may happen that the invalid RSAA does not contain a value that can be used as the *request* FSA `type` property, in which case `redux-api-middleware` will let the RSAA die silently).
  - *Request* FSAs resulting in request errors (step 3 in [Lifecycle](#lifecycle) above) will honor the user-provided `meta`, but will ignore the user-provided `payload`, which is reserved for the default error object.

#### *Success* type descriptors

`payload` and `meta` functions will be passed the RSAA action itself, the state of your Redux store, and the raw server response.

For example, if you want to process the JSON response of the server using [`normalizr`](https://github.com/gaearon/normalizr), you can do it as follows.

```js
import { Schema, arrayOf, normalize } from 'normalizr';
const userSchema = new Schema('users');

// Input RSAA
{
  [CALL_API]: {
    endpoint: 'http://www.example.com/api/users',
    method: 'GET',
    types: [
      'REQUEST',
      {
        type: 'SUCCESS',
        payload: (action, state, res) => {
          const contentType = res.headers.get('Content-Type');
          if (contentType && ~contentType.indexOf('json')) {
            // Just making sure res.json() does not raise an error
            return res.json().then((json) => normalize(json, { users: arrayOf(userSchema) }));
          }
        }
      },
      'FAILURE'
    ]
  }
}

// Output success FSA
{
  type: 'SUCCESS',
  payload: {
    result: [1, 2],
    entities: {
      users: {
        1: {
          id: 1,
          name: 'John Doe'
        },
        2: {
          id: 2,
          name: 'Jane Doe'
        }
      }
    }
  }
}
```

The above pattern of parsing the JSON body of the server response is probably quite common, so `redux-api-middleware` exports a utility function `getJSON` which allows for the above `payload` function to be written as
```js
(action, state, res) => {
  return getJSON(res).then((json) => normalize(json, { users: arrayOf(userSchema) }));
}
```

By default, *success* FSAs will not contain a `meta` property, while their `payload` property will be evaluated from
```js
(action, state, res) => getJSON(res)
```

#### *Failure* type descriptors

`payload` and `meta` functions will be passed the RSAA action itself, the state of your Redux store, and the raw server response &mdash; exactly as for *success* type descriptors. The `error` property of dispatched *failure* FSAs will always be set to `true`.

For example, if you want the status code and status message of a unsuccessful API call in the `meta` property of your *failure* FSA, do the following.

```js
{
  [CALL_API]: {
    endpoint: 'http://www.example.com/api/users/1',
    method: 'GET',
    types: [
      'REQUEST',
      'SUCCESS',
      {
        type: 'FAILURE',
        meta: (action, state, res) => {
          if (res) {
            return {
              status: res.status
              statusText: res.statusText
            };
          } else {
            return {
              status: 'Network request failed'
            }
          }
        }
      }
    ]
  }
}
```
By default, *failure* FSAs will not contain a `meta` property, while their `payload` property will be evaluated from
```js
(action, state, res) =>
  getJSON(res).then(
    (json) => new ApiError(res.status, res.statusText, json)
  )
```

## Reference

### Exports

The following objects are exported by `redux-api-middleware`.

#### `CALL_API`

A JavaScript `Symbol` whose presence as a key in an action signals that `redux-api-middleware` should process said action.

#### `apiMiddleware`

The Redux middleware itself.

#### `isRSAA(action)`

A function that returns `true` if `action` has a `[CALL_API]` property, and `false` otherwise.

#### `validateRSAA(action)`

A function that validates `action` against the RSAA definition, returning an array of validation errors.

#### `isValidRSAA(action)`

A function that returns `true` if `action` conforms to the RSAA definition, and `false` otherwise. Internally, it simply checks the length of the array of validation errors returned by `validateRSAA(action)`.

#### `InvalidRSAA`

An error class extending the native `Error` object. Its constructor takes an array of validation errors as its only argument.

`InvalidRSAA` objects have three properties:

- `name: 'InvalidRSAA'`;
- `validationErrors`: the argument of the call to its constructor; and
- `message: 'Invalid RSAA'`.

#### `InternalError`

An error class extending the native `Error` object. Its constructor takes a string, intended to contain an error message.

`InternalError` objects have two properties:

- `name: 'InternalError'`;
- `message`: the argument of the call to its constructor.

#### `RequestError`

An error class extending the native `Error` object. Its constructor takes a string, intended to contain an error message.

`RequestError` objects have two properties:

- `name: 'RequestError'`;
- `message`: the argument of the call to its constructor.

#### `ApiError`

An error class extending the native `Error` object. Its constructor takes three arguments:

- a status code,
- a status text, and
- a further object, intended for a possible JSON response from the server.

`ApiError` objects have five properties:

- `name: 'ApiError'`;
- `status`: the first argument of the call to its constructor;
- `statusText`: the second argument of the call to its constructor;
- `response`: to the third argument of the call to its constructor; and
- `` message : `${status} - ${statusText}` ``.

#### `getJSON(res)`

A function taking a response object as its only argument. If the response object contains a JSONy `Content-Type`, it returns a promise resolving to its JSON body. Otherwise, it returns a promise resolving to undefined.

### Flux Standard Actions

For convenience, we recall here the definition of a [*Flux Standard Action*](https://github.com/acdlite/flux-standard-action).

An action MUST

- be a plain JavaScript object,
- have a `type` property.

An action MAY

- have an `error` property,
- have a `payload` property,
- have a `meta` property.

An action MUST NOT

- include properties other than `type`, `payload`, `error` and `meta`.

#### `type`

The `type` of an action identifies to the consumer the nature of the action that has occurred. Two actions with the same `type` MUST be strictly equivalent (using `===`). By convention, `type` is usually a string constant or a `Symbol`.

#### `payload`

The optional `payload` property MAY be any type of value. It represents the payload of the action. Any information about the action that is not the `type` or status of the action should be part of the `payload` field.

By convention, if `error` is true, the `payload` SHOULD be an error object. This is akin to rejecting a Promise with an error object.

#### `error`

The optional `error` property MAY be set to `true` if the action represents an error.

An action whose `error` is true is analogous to a rejected Promise. By convention, the `payload` SHOULD be an error object.

If `error` has any other value besides `true`, including `undefined` and `null`, the action MUST NOT be interpreted as an error.

#### `meta`

The optional `meta` property MAY be any type of value. It is intended for any extra information that is not part of the payload.

### Redux Standard API-calling Actions

The definition of a *Redux Standard API-calling Action* below is the one used to validate RSAA actions. As explained in [Lifecycle](#lifecycle),
  - actions without a `[CALL_API]` will be passed to the next middleware without any modifications;
  - actions with a `[CALL_API]` property that fail validation will result in an error *request* FSA.

A *Redux Standard API-calling Action* MUST

- be a plain JavaScript object,
- have a `[CALL_API]` property.

A *Redux Standard API-calling Action* MUST NOT

- include properties other than `[CALL_API]`.

#### `[CALL_API]`

The `[CALL_API]` property MUST

- be a plain JavaScript Object,
- have an `endpoint` property,
- have a `method` property,
- have a `types` property.

The `[CALL_API]` property MAY

- have a `body` property,
- have a `headers` property,
- have a `credentials` property,
- have a `bailout` property.

The `[CALL_API]` property MUST NOT

- include properties other than `endpoint`, `method`, `types`, `body`, `headers`, `credentials`, and `bailout`.

#### `[CALL_API].endpoint`

The `[CALL_API].endpoint` property MUST be a string or a function. In the second case, the function SHOULD return a string.

#### `[CALL_API].method`

The `[CALL_API].method` property MUST be one of the strings `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` or `OPTIONS`, in any mixture of lowercase and uppercase letters.

#### `[CALL_API].body`

The optional `[CALL_API].body` property SHOULD be a valid body according to the the [fetch specification](https://fetch.spec.whatwg.org).

#### `[CALL_API].headers`

The optional `[CALL_API].headers` property MUST be a plain JavaScript object or a function. In the second case, the function SHOULD return a plain JavaScript object.

#### `[CALL_API].credentials`

The optional `[CALL_API].credentials` property MUST be one of the strings `omit`, `same-origin` or `include`.

#### `[CALL_API].bailout`

The optional `[CALL_API].bailout` property MUST be a boolean or a function.

#### `[CALL_API].types`

The `[CALL_API].types` property MUST be an array of length 3. Each element of the array MUST be a string, a `Symbol`, or a type descriptor.

#### Type descriptors

A type descriptor MUST

- be a plain JavaScript object,
- have a `type` property, which MUST be a string or a `Symbol`.

A type descriptor MAY

- have a `payload` property, which MAY be of any type,
- have a `meta` property, which MAY be of any type.

A type descriptor MUST NOT

- have properties other than `type`, `payload` and `meta`.

## History

TODO

## Tests

```
$ npm install && npm test
```

## License

MIT

## Projects using redux-api-middleware

- [react-trebuchet](https://github.com/barrystaes/react-trebuchet/tree/test-bottledapi-apireduxmiddleware) (experimental/opinionated fork of react-slingshot for SPA frontends using REST JSON API backends)

If your opensource project uses (or works with) `redux-api-middleware` we would be happy to list it here!

## Acknowledgements

The code in this module was originally extracted from the [real-world](https://github.com/rackt/redux/blob/master/examples/real-world/middleware/api.js) example in the [redux](https://github.com/rackt/redux) repository, due to [Dan Abramov](https://github.com/gaearon). It has evolved thanks to issues filed by, and pull requests contributed by, other developers.
