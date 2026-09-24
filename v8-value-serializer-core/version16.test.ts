import assert from 'node:assert/strict';
import * as nativeV8 from 'node:v8';
import { ValueDeserializer, ValueSerializer } from './v8-value-serializer.ts';
import { deserialize, serialize } from '../v8-value-serializer/v8.ts';

function decode(bytes: number[]): any {
  const reader = new ValueDeserializer(Uint8Array.from(bytes));
  reader.readHeader();
  return reader.readObjectWrapper();
}

// Captured with VS Code 1.139.0 / Electron 43.6.0 / V8 15.0.245.31.
const object = [255, 16, 111, 34, 5, 104, 101, 108, 108, 111, 34, 5, 119, 111, 114, 108, 100, 123, 1];
const buffer = [255, 16, 66, 4, 1, 2, 3, 4];
const typedView = [...buffer, 86, 87, 2, 2, 0];
const dataView = [...buffer, 86, 63, 1, 2, 0];

Deno.test('reads V8 format 16 and retains format 15 compatibility', () => {
  for (const version of [15, 16]) {
    const withVersion = (bytes: number[]) => [255, version, ...bytes.slice(2)];
    assert.deepEqual(decode(withVersion(object)), { hello: 'world' });
    assert.deepEqual([...new Uint8Array(decode(withVersion(buffer)))], [1, 2, 3, 4]);
    const typed = decode(withVersion(typedView)) as Uint16Array;
    assert(typed instanceof Uint16Array);
    assert.equal(typed.byteOffset, 2);
    assert.deepEqual([...new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength)], [3, 4]);
    const view = decode(withVersion(dataView)) as DataView;
    assert(view instanceof DataView);
    assert.equal(view.byteOffset, 1);
    assert.equal(view.byteLength, 2);
    assert.equal(view.getUint16(0), 0x0203);
  }
});

Deno.test('reads format 16 wire frames and their nested Node host-object payloads', () => {
  const frame = Uint8Array.from([
    255, 16, 65, 5, 34, 7, 109, 101, 115, 115, 97, 103, 101, 48, 92, 10, 19,
    ...object, 65, 0, 36, 0, 0, 48, 36, 0, 5,
  ]);
  const [type, target, payload, ports, move] = deserialize(frame) as any[];
  assert.equal(type, 'message');
  assert.equal(target, null);
  assert(payload instanceof Uint8Array);
  assert.deepEqual(deserialize(payload), { hello: 'world' });
  assert.deepEqual(ports, []);
  assert.equal(move, null);
  const typed = deserialize(Uint8Array.from([255, 16, 92, 4, 2, 3, 4])) as Uint16Array;
  assert(typed instanceof Uint16Array);
  assert.deepEqual([...new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength)], [3, 4]);
});

Deno.test('reads a format 16 resizable buffer with a maximum above 4 GiB', () => {
  // Zero committed bytes: tests the wide length without allocating a huge buffer.
  const bytes = [255, 16, 126, 0, 144, 128, 128, 128, 16];
  const value = decode(bytes) as ArrayBuffer;
  assert.equal(value.byteLength, 0);
  assert.equal(value.maxByteLength, 2 ** 32 + 16);
  assert.equal(value.resizable, true);
  // A format 15 writer must reject this maximum instead of truncating it.
  assert.throws(() => serialize(value));
  assert.throws(() => decode([255, 15, ...bytes.slice(2)]));
});

Deno.test('rejects truncated, overflowing and out-of-bounds format 16 sizes', () => {
  const invalidSizes = [
    [0x80], // Truncated varint.
    [0x80, 0x80, 0x80, 0x80, 0x10], // 2 ** 32; cannot fit in the input/buffer.
    [0x80, 0x80, 0x80, 0x80, 0x80, 0x01], // 2 ** 35; must not wrap at bit 32.
    [...Array(7).fill(0x80), 0x10], // 2 ** 53; cannot be represented safely in JS.
    [...Array(9).fill(0x80), 0x02], // uint64 overflow.
    [...Array(10).fill(0x80), 0x00], // Overlong varint.
  ];
  for (const size of invalidSizes) {
    assert.throws(() => decode([255, 16, 66, ...size]));
    for (const tag of [63, 66]) { // DataView and Uint8Array.
      assert.throws(() => decode([255, 16, 66, 0, 86, tag, ...size, 0, 0]));
      assert.throws(() => decode([255, 16, 66, 0, 86, tag, 0, ...size, 0]));
    }
  }
  assert.throws(() => decode([255, 17, 48]));
});

Deno.test('continues writing format 15 for older V8 receivers', () => {
  const value = { hello: 'world', buffer: Uint8Array.from([1, 2, 3]).buffer };
  const writer = new ValueSerializer();
  writer.writeHeader();
  writer.writeObject(value);
  const bytes = writer.release();
  assert.deepEqual([...bytes.subarray(0, 2)], [255, 15]);
  assert.deepEqual(nativeV8.deserialize(bytes), value);
  assert.deepEqual(deserialize(serialize(value)), value);
});
