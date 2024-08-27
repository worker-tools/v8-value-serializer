/**
 * Allows using the V8 serialization format as a transform stream. 
 * 
 * Note that these are not a general-purpose streams, i.e. it can't deserialize values that weren't serialized with this library 
 * and other libraries can't deserialize values serialized with this library, unless the implement the same double-encoding scheme described below.
 * @module
 */

import { Serializer, SerializerOptions, Deserializer, DeserializerOptions } from "./serdes.ts";

/** Customize behavior of the serializer stream */
export interface SerializerStreamOptions extends SerializerOptions {
  /** Provide a custom serializer class */
  serializer?: new (opts?: any) => { serialize(value: any): Uint8Array }
}

/** Customize behavior of the deserializer stream */
export interface DeserializerStreamOptions extends DeserializerOptions {
  /** Provide a custom {@link Deserializer} class */
  deserializer?: new (buffer: Uint8Array, opts?: any) => { deserialize(): any }
}

/**
 * A transform stream meant to serialize a multiple JS values over time.
 *
 * Each value is double encoded to aid deserialization. This ensures that the byte length is prepended,
 * s.t. the deserializer doesn't have to do unnecessary work until enough bytes are buffered, without inventing any new message format.
 * Values need to piped through the {@link DeserializerStream} to be deserialized.
 */
export class SerializerStream extends TransformStream<any, Uint8Array> {
  constructor(options?: SerializerStreamOptions) {
    const Ser = options?.serializer ?? Serializer;
    super({
      transform(value, controller) {
        const body = new Ser(options).serialize(value);
        // Using the plain JS serializer for the outer encoding. 
        // Custom serializers might handle `Uint8Array`s in arbitrary ways and we don't want that for the part that makes streaming possible.
        // Since it's just writing an `Uint8Array` the performance impact should be negigible.
        const chunk = new Serializer().serialize(body);
        controller.enqueue(chunk);
      },
    });
  }
}

/**
 * A transform stream meant to deserialize values encoded with the serializer stream.
 *
 * It can only be used together with {@link SerializerStream} because it expects a double-encoded format described there.
 */
export class DeserializerStream extends TransformStream<Uint8Array, any> {
  constructor(options?: DeserializerStreamOptions) {
    let incompleteBuffer: Uint8Array|null = null;
    const Des = options?.deserializer ?? Deserializer;
    super({
      transform(chunk, controller) {
        if (incompleteBuffer) {
          chunk = concat(incompleteBuffer, chunk);
          incompleteBuffer = null;
        }

        while (true) {
          if (chunk.byteLength < 5) {
            incompleteBuffer = chunk;
            return;
          }

          // Need to use our plain JS deserializer for the outer encoding because we need access to internal properties to make streaming possible.
          // Since we just read an `Uint8Array` the performance impact should be negigible.
          const deserializerCore = (new Deserializer(chunk) as any).deserializer;
          deserializerCore.suppressDeserializationErrors = true;

          const body = deserializerCore.readObject();
          if (body !== null) {
            const value = new Des(body, options).deserialize();
            controller.enqueue(value);
            chunk = chunk.subarray(deserializerCore.position);
          } else {
            incompleteBuffer = chunk;
            break;
          }
        }
      },
    })
  }
}


function concat(a: Uint8Array, b: Uint8Array) {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}
