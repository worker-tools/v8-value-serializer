/**
 * A plain JS implementation of V8's value serialization format. 
 * @module
 */

import { Deserializer, type DeserializerOptions, Serializer, type SerializerOptions } from "./serdes.ts";

export type { DeserializerOptions, SerializerOptions };
export { Deserializer, Serializer };

/** Serialize a JavaScript object according to the Structured Clone Algorithm */
export function serialize(value: any, options?: SerializerOptions): Uint8Array {
  return new Serializer(options).serialize(value);
}

/** Deserialize a JavaScript object that was serialized using either this library or node's `v8` module. */
export function deserialize(buffer: BufferSource, options?: DeserializerOptions): any {
  return new Deserializer(buffer, options).deserialize();
}

export * from './stream.ts';
