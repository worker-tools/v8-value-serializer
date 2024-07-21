# V8 Value Serializer

A pure JS implementation of V8's value serialization format.

V8 has an internal object serialization format that implements the [Structured Clone Algorithm][sca] and is used to implement things like `structuredClone` and `postMessage`.

Node users have access to this format via the [`v8` module][v8m], but other JS runtimes, including all browser environments, can only use it through userland implementations. This library is currently the only such implementation that supports the latest protocol version and supports both encoding and decoding. (See [Prior Art](#prior-art) for others).

The module is a direct port of the C++ source from the V8 repository and aims for the best cross-section between accuracy and performance. 

The format is quite neat and purpose-built to handle many of JS' peculiarities, such as holes in arrays, unmatched surrogate pairs in strings and primitives wrappers.
Out of [all the ways to serialize a JavaScript object][1], it is likely the best choice, especially since there's a fast native implementation available in Node.

[sca]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
[v8m]: https://nodejs.org/api/v8.html#serialization-api
[1]: https://qwtel.com/posts/software/how-to-serialize-a-javascript-object/

## Prior Art

- https://github.com/addaleax/serdes/blob/master/index.js
- https://github.com/losfair/v8-serde/blob/main/value_deserializer.ts

