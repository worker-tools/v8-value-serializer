import { Serializer, SerializerOptions, Deserializer, DeserializerOptions } from "./serdes.ts";

/** Customize behavior of the serializer stream */
export interface SerializerStreamOptions extends SerializerOptions {
  /** Provide a custom {@link Serializer} class */
  serializer?: typeof Serializer
}

/** Customize behavior of the deserializer stream */
export interface DeserializerStreamOptions extends DeserializerOptions {
  /** Provide a custom {@link Deserializer} class */
  deserializer?: typeof Deserializer
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
    super({
      transform(value, controller) {
        const body = new (options?.serializer ?? Serializer)(options).serialize(value);
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

          const deserializer = new Deserializer(chunk, options);
          (deserializer as any).deserializer.suppressDeserializationErrors = true;
          const body = (deserializer as any).deserializer.readObject();

          if (body !== null) {
            const value = new (options?.deserializer ?? Deserializer)(body, options).deserialize();
            controller.enqueue(value);
            chunk = chunk.subarray((deserializer as any).deserializer.position);
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
