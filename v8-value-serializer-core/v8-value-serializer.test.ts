import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { Buffer } from 'node:buffer'
import * as V8 from 'node:v8'
import { ValueDeserializer, ValueSerializer } from "./v8-value-serializer.ts";

(globalThis as any).Buffer = Buffer;

const testCases = [
  { foo: 'bar', baz: 42, qux: true, quux: null, corge: undefined, grault: [1, 2, 3], garply: { waldo: 'fred' }, fred: new Date(), plugh: /xyz/ },
  [1, 2, 3],
  { a: [1, 2, 3] },
  [1.0, 2.0, 3.0],
  [{ x: 1 }, { x: 2 }, { x: 3 }],
  /xyz/,
  /xyz/gimsuy,
  new DataView(new ArrayBuffer(8)),
  { x: null },
  [null, null],
  (() => {
    const obj = { prop: 'x' };
    (obj as any).obj = obj;
    return obj;
  })(),
  new Set([1, 2, 3]),
  new Set(["a", "b"]),
  new Map([["a", "b"]]),
  new Map([[new Set([1]), "b"]]),
  new Set([null]),
  new Map([[null, null]]),
  new ArrayBuffer(8),
  new Uint8Array(8).fill(255),
  crypto.getRandomValues(new Uint8Array(8)),
  crypto.getRandomValues(new Uint8Array(4096)),
  new Error(),
  new Error("Err"),
  new SyntaxError('foobar', { cause: new TypeError("???") }),
  new SyntaxError('foobar', { cause: new TypeError("???", { cause: Error("Err") }) }),
  new Error("Err", { cause: null }),
  0n,
  255n,
  2n ** 32n - 1n,
  2n ** 32n,
  2n ** 64n - 1n,
  2n ** 64n,
  2n ** 128n - 1n,
  2n ** 128n,
  2n ** 1024n,
  Object(1n), // bigint primitive wrapper,
  new String("s"),
  new Boolean(true),
  new Boolean(false),
  new Number(3),
  [1, 2, undefined, 4],
  [1, 2,, 4],
  [,,3,,],
  [,,null,,],
  [...crypto.getRandomValues(new Uint8Array(8))], 
  (() => {
    const obj = [1,2,3];
    (obj as any).foo = 'bar';
    return obj;
  })(),
  (() => {
    const obj = [1,,3];
    (obj as any).foo = 'bar';
    return obj;
  })(),
  { '0': 255, '1': 255 },
  { '0': 255, '1': 255, length: 2 },
  Infinity,
  -Infinity,
  Number.MAX_VALUE,
  Number.MAX_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER + 1,
  Number.MAX_SAFE_INTEGER + 2,
  Number.MAX_SAFE_INTEGER + 3,
  '',
  '☃',
  '😊',
  '😊'.slice(0, 1),
  '𐌀',
  'é',
  'Ã©',
  'éé',
  '\uD834',          // high surrogate without matching low surrogate,
  '\uDD1E',          // low surrogate without matching high surrogate,
  '\uD834\u0061',    // high surrogate followed by regular character,
  '\u0061\uDD1E',    // regular character followed by low surrogate,
  "a".repeat(128),
  "a".repeat(129),
  Math.random().toString(36).substring(2).repeat(10),
  -1,
  -Infinity,
  0,
  -0,
  Number.MIN_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER - 1,
  Number.MIN_SAFE_INTEGER - 2,
  Number.MIN_SAFE_INTEGER - 3,
  String.fromCharCode(...crypto.getRandomValues(new Uint16Array(1000))),
  new ArrayBuffer(8),
  // @ts-ignore
  new ArrayBuffer(8, { maxByteLength: 4096 }),
  // @ts-ignore
  new ArrayBuffer(8, { maxByteLength: 2 ** 10 }),
  // @ts-ignore
  new ArrayBuffer(8, { maxByteLength: 2 ** 20 }),
  // @ts-ignore
  new ArrayBuffer(8, { maxByteLength: 2 ** 30 }),
  // // @ts-ignore
  // new ArrayBuffer(8, { maxByteLength: 2 * 2 ** 30 }),
  // // @ts-ignore
  // new Uint8Array(new ArrayBuffer(8, { maxByteLength: 4096 }))
];

Deno.test("serialize", async (t) => {
  for (const obj of testCases) {
    const inspected = Deno.inspect(obj).replace(/^\ \ +/gm, ' ').replaceAll('\n', '').substring(0, 100)
    await t.step(`round-tripping ${inspected}`, () => {
      const ser = new ValueSerializer()
      ser.writeHeader();
      ser.writeObject(obj);
      const actual = ser.release()
      const expected = V8.serialize(obj)
      // Can't compare buffers directly, because may change with V8 version
      if (actual.byteLength !== expected.byteLength) {
        console.warn(`Length mismatch:`, actual.byteLength, 'vs', expected.byteLength)
        // console.log(expected)
        // console.log(actual)
      }

      const expectedDeserialized = V8.deserialize(expected);
      assertEquals(V8.deserialize(actual), expectedDeserialized)

      const der = new ValueDeserializer(expected)
      der.readHeader();
      const selfDeserialized = der.readObjectWrapper();
      assertEquals(selfDeserialized, expectedDeserialized)

      // console.log([...actual].map(code => {
      //   return (code < 32 || code > 126) ? '.' : String.fromCharCode(code);
      // }).join(''))
    })
  }

  await t.step("round-tripping all at once", () => {
    const expected = V8.serialize(testCases)
    // console.log(expected, expected.byteLength)

    const ser = new ValueSerializer()
    ser.writeHeader();
    ser.writeObject(testCases);
    const actual = Buffer.from(ser.release())

    // console.log(actual, actual.byteLength)
    assertEquals(V8.deserialize(actual), V8.deserialize(expected))
  });
})

Deno.test("stream", () => {
  const obj = {
    num: 3,
    date: new Date(),
    data: crypto.getRandomValues(new Uint8Array(4)),
    dict: new Map([['foo', 11], ['bar', 12] ]),
    array: [1, 2, 3, /* hole in array */, 5],
    regex: /xyz/g,
    error: new Error('xxx', { cause: new TypeError('yyy') })
  };
  
  const ser = new ValueSerializer()
  ser.writeHeader();
  ser.writeObject(obj);
  ser.writeObject(obj);
  const buffer = ser.release();

  const partial = buffer.slice(0, buffer.length);

  const des = new ValueDeserializer(partial)
  des.readHeader();
  console.log(des.readObjectWrapper());
  console.log(des.readObjectWrapper());
})


