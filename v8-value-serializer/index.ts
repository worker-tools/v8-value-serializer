import { Deserializer, DeserializerOptions, Serializer, SerializerOptions } from "./serdes.ts";

export type { ValueDeserializerDelegate, ValueSerializerDelegate } from "./serdes.ts";
export type { DeserializerOptions, SerializerOptions };

/** Serialize a JavaScript object according to the Structured Clone Algorithm */
export function serialize(value: any, options?: SerializerOptions): Uint8Array {
  return new Serializer(options).serialize(value);
}

/** Deserialize a JavaScript object that was serialized using either this library or node's `v8` module. */
export function deserialize(buffer: BufferSource, options?: DeserializerOptions): any {
  return new Deserializer(buffer, options).deserialize();
}

export * from './stream.ts';
