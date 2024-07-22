import { serialize, deserialize } from "./index.ts";
import { assertEquals } from "jsr:@std/assert";
import { Deserializer, Serializer } from "./serdes.ts";
import { SerializationTag } from "jsr:@workers/v8-value-serializer-core@^0.1.8";

Deno.test("serialize and deserialize ArrayBuffer", () => {
  const o = new ArrayBuffer(8);
  const a = deserialize(serialize(o));
  assertEquals(a, o);
});

Deno.test("custom serializer/deserializer implementation", () => {
  class Port { constructor(public value: any) {} }

  const expected = [{ port: new Port({ a: 1 }) }, [new Port({ b: 2 })]];

  class PortSerializer extends Serializer {
    get hasCustomHostObjects(): boolean { return true }
    isHostObject(object: unknown): boolean {
      return object instanceof Port;
    }
    writeHostObject(object: object): boolean {
      if (object instanceof Port) {
        this.serializer.writeUint32(SerializationTag.kLegacyReservedMessagePort); // tag
        this.serializer.writeObject(object.value);
        return true;
      }
      return super.writeHostObject(object as ArrayBufferView);
    }
  }

  class PortDeserializer extends Deserializer {
    readHostObjectForTag(tag: number): object | null {
      if (tag === SerializationTag.kLegacyReservedMessagePort) {
        const value = this.deserializer.readObjectWrapper();
        return value && new Port(value);
      }
      return super.readHostObjectForTag(tag);
    }
  };

  const actual = new PortDeserializer(new PortSerializer().serialize(expected)).deserialize();
  assertEquals(actual, expected);
});