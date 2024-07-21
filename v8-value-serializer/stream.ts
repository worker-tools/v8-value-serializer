import { Serializer, SerializerOptions, Deserializer, DeserializerOptions } from "./serdes.ts";

export class V8ValueSerializerStream extends TransformStream<any, Uint8Array> {
  constructor(options?: SerializerOptions) {
    super({
      transform(chunk, controller) {
        const body = new Serializer(options).serialize(chunk);
        const bodyWrapper = [body];
        controller.enqueue(new Serializer().serialize(bodyWrapper));
      },
    });
  }
}

export class V8ValueDeserializerStream extends TransformStream<Uint8Array, any> {
  constructor(options?: DeserializerOptions) {
    let incompleteBuffer: Uint8Array|null = null;
    super({
      transform(chunk, controller) {
        if (incompleteBuffer) {
          chunk = concat(incompleteBuffer, chunk);
          incompleteBuffer = null;
        }

        while (true) {
          if (chunk.byteLength < 12) {
            incompleteBuffer = chunk;
            return;
          }

          const deserializer = new Deserializer(chunk, options);
          (deserializer as any).deserializer.suppressDeserializationErrors = true;
          const bodyWrapper = (deserializer as any).deserializer.readObject();

          if (bodyWrapper !== null) {
            const [body] = bodyWrapper;
            const value = new Deserializer(body, options).deserialize();
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
