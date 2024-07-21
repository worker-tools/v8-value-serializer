import { assertEquals } from "jsr:@std/assert";
import { DeserializerStream, SerializerStream } from "./stream.ts";
import { encodeHex } from "jsr:@std/encoding";

Deno.test("basic stream support", async () => {
  const stream = ReadableStream.from((async function* () {
    yield { a: 1 };
    yield { a: 2 };
    yield { a: 3 };
  })());
  const actual = await Array.fromAsync(stream
    .pipeThrough(new SerializerStream())
    .pipeThrough(new DeserializerStream())
  );
  assertEquals(actual, [{ a: 1 }, { a: 2 }, { a: 3 }]);
})

const timeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Deno.test("basic messages with jitter", async () => {
  const expected = [{ a: 1 }, { a: 2 }, { a: 3 }];
  const stream = ReadableStream.from(expected);
  const actual = await Array.fromAsync(stream
    .pipeThrough(new SerializerStream())
    .pipeThrough(new TransformStream({
      transform(chunk, ctrl) {
        const splitAt = Math.floor(Math.random() * chunk.byteLength);
        // console.log({ splitAt })
        ctrl.enqueue(chunk.subarray(0, splitAt));
        ctrl.enqueue(chunk.subarray(splitAt));
      }
    }))
    .pipeThrough(new DeserializerStream())
  );
  assertEquals(actual, expected);
})

Deno.test("long messages with jitter", async () => {
  const expected = [
    { a: 1, data: crypto.getRandomValues(new Uint8Array(4096)) },
    { a: 2, data: crypto.getRandomValues(new Uint8Array(4096)) },
    { a: 3, data: crypto.getRandomValues(new Uint8Array(4096)) },
  ];
  const stream = ReadableStream.from(expected);
  const actual = await Array.fromAsync(stream
    .pipeThrough(new SerializerStream())
    .pipeThrough(new TransformStream({
      async transform(chunk, ctrl) {
        const numSplits = Math.floor(Math.random() * 10);
        for (let i = 0; i < numSplits; i++) {
          const splitAt = Math.floor(Math.random() * chunk.byteLength);
          // console.log({ splitAt })
          ctrl.enqueue(chunk.subarray(0, splitAt));
          chunk = chunk.subarray(splitAt);
          await timeout(0);
        }
        ctrl.enqueue(chunk);
      }
    }))
    .pipeThrough(new DeserializerStream())
  );
  assertEquals(actual, expected);
})

Deno.test("empty values", async () => {
  const expected = [null, undefined, false, '', {}, []];
  const stream = ReadableStream.from(expected);
  const actual = await Array.fromAsync(stream
    .pipeThrough(new SerializerStream())
    .pipeThrough(new DeserializerStream())
  );
  assertEquals(actual, expected);
})
