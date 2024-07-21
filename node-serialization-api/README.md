# Node Serialization API Polyfill

A pure JS polyfill for Node's [Serialization API](https://nodejs.org/api/v8.html#serialization-api).

## Usage

```ts
import { serialize, deserialize } from 'jsr:@workers/node-serialization-api';

const obj = {
  num: 3,
  date: new Date(),
  data: crypto.getRandomValues(new Uint8Array(4)),
  dict: new Map([
    ['foo', 11],
    [new Set([1,2,3]), 12],
  ]),
  array: [1, 2, 3, /* hole in array */, 5],
  regex: /xyz/g,
  error: new Error('xxx', { cause: new TypeError('yyy') })
};
obj.self = obj;

deserialize(serialize(obj));
```