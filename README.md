# V8 Value Serializer

A pure JS implementation of V8's value serialization format.

V8 has an internal object serialization format that implements the Structured Clone Algorithm.
Node users have access to this format via the `v8` module, but other JS runtimes, including all browser environments, can only participate in this format through userland implementations, which this library provides.

The module is a direct port of the C++ source from the V8 repository and aims for the best cross-section between accuracy and performance. 

The format is quite neat and purpose-built to handle many of JS' peculiarities, such as holes in arrays or unmatched surrogate pairs in strings.
Out of [all the ways to serialize a JavaScript object][1], it is likely the best choice, especially since there's a fast native implementation available in Node.

[1]: https://qwtel.com/posts/software/how-to-serialize-a-javascript-object/

## Contents

- `v8-value-serializer.ts`: A port of V8's [`value-serializer.cc`](https://github.com/v8/v8/blob/main/src/objects/value-serializer.cc) to pure JS. The API is C-like and not recommended for direct use

- `v8.js`: A polyfill for Node's [Serialization API](https://nodejs.org/api/v8.html#serialization-api).

- `index.ts`: Implements the same format as Node's Serialization API, but without dependencies on `Buffer` or other Node specific classes.

## Prior Art

- https://github.com/addaleax/serdes/blob/master/index.js
- https://github.com/losfair/v8-serde/blob/main/value_deserializer.ts

