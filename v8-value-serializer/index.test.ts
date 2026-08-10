import { serialize, deserialize } from "./index.ts";
import { assertEquals } from "jsr:@std/assert";
import { Deserializer, Serializer } from "./serdes.ts";
import { SerializationTag } from "@workers/v8-value-serializer-core";
import * as NativeV8 from "node:v8";
import * as V8Compat from "./v8.ts";
import * as NodeCompat from "../node-serialization-api/v8.ts";

type SerializationApi = {
  serialize(value: any): ArrayBufferView;
  deserialize(buffer: ArrayBuffer | ArrayBufferView): any;
};

const serializationApis: [string, SerializationApi][] = [
  ["public API", { serialize, deserialize }],
  ["Uint8Array v8 API", V8Compat],
  ["Node API", NodeCompat],
];

function asUint8Array(view: ArrayBufferView): Uint8Array {
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

function nativeSerialize(value: any): Uint8Array {
  return asUint8Array(NativeV8.serialize(value));
}

function assertArrayBufferViewEquals(actual: ArrayBufferView, expected: ArrayBufferView): void {
  assertEquals(Object.prototype.toString.call(actual), Object.prototype.toString.call(expected));
  assertEquals(actual.byteLength, expected.byteLength);
  assertEquals(asUint8Array(actual), asUint8Array(expected));
}

function assertNodeCompatible(api: SerializationApi, value: ArrayBufferView): void {
  const nativeBytes = nativeSerialize(value);
  const packageBytes = asUint8Array(api.serialize(value));

  assertEquals(packageBytes, nativeBytes);
  assertArrayBufferViewEquals(api.deserialize(nativeBytes), value);
  assertArrayBufferViewEquals(NativeV8.deserialize(packageBytes), value);
}

Deno.test("serialize and deserialize ArrayBuffer", () => {
  const o = new ArrayBuffer(8);
  const a = deserialize(serialize(o));
  assertEquals(a, o);
});

Deno.test("preserves references around sparse array holes", () => {
  const shared = { value: 1 };
  const value = [shared, , shared];
  const actual = deserialize(serialize(value));

  assertEquals(actual, value);
  assertEquals(1 in actual, false);
  assertEquals(actual[0] === actual[2], true);
});

Deno.test("preserves numeric-looking array properties", () => {
  const value = Object.assign([1, 2], {
    "01": "leading zero",
    "-1": "negative",
    "1e0": "exponent",
    "4294967295": "past the last array index",
  });

  assertEquals(deserialize(serialize(value)), value);
});

Deno.test("reads V8 one-byte strings without Windows-1252 remapping", () => {
  for (let codeUnit = 0x80; codeUnit <= 0x9f; codeUnit++) {
    const value = String.fromCharCode(codeUnit);
    assertEquals(
      deserialize(nativeSerialize(value)),
      value,
      `U+${codeUnit.toString(16).padStart(4, "0")}`,
    );
  }
});

Deno.test("custom serializer/deserializer implementation", () => {
  class Port { constructor(public value: any) {} }

  const expected = [{ port: new Port({ a: 1 }) }, [new Port({ b: 2 })]];

  class PortSerializer extends Serializer {
    override get hasCustomHostObjects(): boolean { return true }
    override isHostObject(object: unknown): boolean {
      return object instanceof Port;
    }
    override writeHostObject(object: object): boolean {
      if (object instanceof Port) {
        this.serializer.writeUint32(SerializationTag.kLegacyReservedMessagePort); // tag
        this.serializer.writeObject(object.value);
        return true;
      }
      return super.writeHostObject(object as ArrayBufferView);
    }
  }

  class PortDeserializer extends Deserializer {
    override readHostObjectForTag(tag: number): object | null {
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

Deno.test("Node-compatible ArrayBufferView host objects", async (t) => {
  const constructors: Array<new (length: number) => ArrayBufferView> = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  ];
  if (typeof globalThis.Float16Array === "function") {
    constructors.push(globalThis.Float16Array);
  }

  const values: ArrayBufferView[] = constructors.flatMap((Ctor) => [
    new Ctor(0),
    new Ctor(2),
  ]);
  values.push(new DataView(new ArrayBuffer(0)), new DataView(new ArrayBuffer(8)));

  for (const [apiName, api] of serializationApis) {
    for (const value of values) {
      const type = Object.prototype.toString.call(value).slice(8, -1);
      await t.step(`${apiName}: ${type}(${value.byteLength})`, () => {
        assertNodeCompatible(api, value);
      });
    }
  }
});

Deno.test("preserves negative zero across the Node boundary", () => {
  for (const [, api] of serializationApis) {
    const packageBytes = asUint8Array(api.serialize(-0));
    assertEquals(Object.is(api.deserialize(packageBytes), -0), true);
    assertEquals(Object.is(api.deserialize(nativeSerialize(-0)), -0), true);
    assertEquals(Object.is(NativeV8.deserialize(packageBytes), -0), true);
  }
});

Deno.test("preserves modern RegExp flags across the Node boundary", () => {
  for (const flags of ["d", "v", "dgimsvy"]) {
    let value: RegExp;
    try {
      value = new RegExp("a", flags);
    } catch {
      continue;
    }

    for (const [, api] of serializationApis) {
      const packageBytes = asUint8Array(api.serialize(value));
      assertEquals(api.deserialize(nativeSerialize(value)).flags, value.flags);
      assertEquals(NativeV8.deserialize(packageBytes).flags, value.flags);
    }
  }
});
