redux-api-middleware
====================

[![Build Status](https://travis-ci.org/agraboso/redux-api-middleware.svg?branch=master)](https://travis-ci.org/agraboso/redux-api-middleware) [![Coverage Status](https://coveralls.io/repos/agraboso/redux-api-middleware/badge.svg?branch=master&service=github)](https://coveralls.io/github/agraboso/redux-api-middleware?branch=master)

[Redux middleware](http://rackt.github.io/redux/docs/advanced/Middleware.html) for calling an API.

This middleware receives *Redux Standard API-calling Actions* and dispatches *Flux Standard Actions* as explained below.

## Flux Standard Actions (FSA)

Recall the definition of a [*Flux Standard Action*](https://github.com/acdlite/flux-standard-action).

> An action MUST
>
> - be a plain JavaScript object,
> - have a `type` property.
>
> An action MAY
>
> - have an `error` property,
> - have a `payload` property,
> - have a `meta` property.
>
> An action MUST NOT
>
> - include properties other than `type`, `payload`, `error` and `meta`.
>
> ### `type`
>
> The `type` of an action identifies to the consumer the nature of the action that has occurred. Two actions with the same `type` MUST be strictly equivalent (using `===`). By convention, `type` is usually a string constant or a `Symbol`.
>
> ### `payload`
>
> The optional `payload` property MAY be any type of value. It represents the payload of the action. Any information about the action that is not the `type` or status of the action should be part of the `payload` field.
>
> By convention, if `error` is true, the `payload` SHOULD be an error object. This is akin to rejecting a promise with an error object.
>
> ### `error`
>
> The optional `error` property MAY be set to `true` if the action represents an error.
>
> An action whose `error` is true is analogous to a rejected Promise. By convention, the `payload` SHOULD be an error object.
>
> If `error` has any other value besides `true`, including `undefined` and `null`, the action MUST NOT be interpreted as an error.
>
> ### `meta`
>
> The optional `meta` property MAY be any type of value. It is intended for any extra information that is not part of the payload.

A *Redux Standard API-calling Action* conforms to a schema that comes close to being a superset of that of an FSA.

## Redux Standard API-calling Actions (RSAA)

A *Redux Standard API-calling Action* MUST

- be a plain JavaScript object,
- have a `[CALL_API]` property, where `CALL_API` is a `Symbol` defined in, and exported by `redux-api-middleware`.

A *Redux Standard API-calling Action* MAY

- have a `payload` property,
- have a `meta` property.

A *Redux Standard API-calling Action* MUST NOT

- include properties other than `[CALL-API]`, `payload`, and `meta`.

### `[CALL_API]`

The `[CALL_API]` property MUST

- be a plain JavaScript Object,
- have an `endpoint` property,
- have a `method` property,
- have a `types` property.

The `[CALL_API]` property MAY

- have a `body` property,
- have a `headers` property,
- have a `schema` property,
- have a `bailout` property.

The `[CALL_API]` property MUST NOT

- include properties other than `endpoint`, `method`, `types`, `body`, `headers`, `schema` and `bailout`.

### `[CALL_API].endpoint`

The `[CALL_API].endpoint` property must be a string or a function. In the second case, the function SHOULD return a string. It represents the URL endpoint for the API request.

### `[CALL_API].method`

The `[CALL_API].method` property MUST be one of the strings `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` or `OPTIONS` (in any mixture of lowercase and uppercase letters). It represents the HTTP method for the API request.

### `[CALL_API].types`

The `[CALL_API].types` property MUST be an array of length 3, representing the `REQUEST`, `SUCCESS` and `FAILURE` states of the API call, in that order. By convention, each of the `types` is usually a string constant or a `Symbol`.

### `[CALL_API].body`

The optional `[CALL_API].body` property SHOULD be a valid body according to the the [fetch specification](https://fetch.spec.whatwg.org). It represents the body of the API request.

### `[CALL_API].headers`

The optional `[CALL_API].headers` property MUST be a plain JavaScript object. It represents the headers of the API request.

### `[CALL_API].schema`

The optional `[CALL_API].schema` property MUST be a [`normalizr`](https://www.npmjs.com/package/normalizr) schema, or an `arrayOf` thereof. It specifies with which `normalizr` schema we should process the API response

### `[CALL_API].bailout`

The optional `[CALL_API].bailout` property MUST be a boolean or a function. When it returns a falsy value, the API request will not be made, and no FSA action will be dispatched to the next middleware.

### `payload`

The optional `payload` property MAY be any type of value.

### `meta`

The optional `meta` property MAY be any type of value. It is intended for any extra information that is not part of the `payload ` or the `[CALL_API]` data.

## What this middleware does

This middleware expects an RSAA and dispatches FSAs in the following way.

- An FSA with the `REQUEST` type is dispatched to the next middleware as soon as the RSAA comes in.
  - The `payload` property of this FSA is that of the original RSAA.
  - The `meta` property of this FSA is that of the original RSAA.
- If the request is successful, an FSA with the `SUCCESS` type is dispatched to the next middleware.
  - The `payload` property of this FSA is a merge of the original RSAA's `payload` property and the JSON response from the server.
  - The `meta` property of this FSA is that of the original RSAA.
- If the request is unsuccessful, an FSA with the `FAILURE` type is dispatched to the next middleware.
  - The `payload` property of this FSA is an error object with the following properties:
    - `status`: the status code of the response from the server;
    - `statusText`: the status text of the response from the server;
    - `message`: a join of the last two; and
    - `response`: if the server responded with a JSON object and a json-like `Content-Type` header, `response` contains the parsed JSON object; otherwise, it is the raw response object.
  - The `meta` property of this FSA is the same as that of the original RSAA.
  - The `error` property of this FSA is set to `true`.

If the incoming action does not contain a `[CALL_API]` key, it is passed to the next middleware without any modifications.

## Example

### actionCreators.js

```js
import { CALL_API } from 'redux-api-middleware';
import { Schema } from 'normalizr';

const userSchema = new Schema({...});

export function fetchUser(userId, schema = userSchema) {
  return {
    [CALL_API]: {
      types: ['FETCH_USER.REQUEST', 'FETCH_USER.SUCCESS', 'FETCH_USER.FAILURE'],
      endpoint: `/users/${userId}`,
      method: 'GET',
      headers: { credentials: 'same-origin'},
      schema
    },
    payload: { somePayload },
    meta: { someMeta }
  };
}
```

The `headers: { credentials: 'same-origin'}` property sends the authentication credentials stored in cookies by an `express` server using `passport` (other options might work too).

### configureStore.js

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

### app.js

```js
const store = configureStore(initialState);
```

### Resulting actions

```js
{
  type: 'FETCH_USER.REQUEST',
  payload: { somePayload },
  meta: { someMeta }
}
```


```js
{
  type: 'FETCH_USER.SUCCESS',
  payload: { ...somePayload, response },
  meta: { someMeta }
}
```

```js
{
  type: 'FETCH_USER.FAILURE',
  payload: error,
  meta: { someMeta }
  error: true
}
```

## Utilities

Apart from the middleware above, `redux-api-middleware` exposes the following utility function.

### isRSAA(action)

Returns `true` if `action` is RSAA-compliant.

## Installation

```
npm install redux-api-middleware
```

## Tests

```
npm test
```

## License

MIT

## Acknowledgements

The code in this module is *heavily* based upon that in the [real-world](https://github.com/rackt/redux/blob/master/examples/real-world/middleware/api.js) example in the [redux](https://github.com/rackt/redux) repository, which I believe is due to [Dan Abramov](https://github.com/gaearon). Please correct me if I am wrong.
