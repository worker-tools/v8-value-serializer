import { serialize, deserialize } from "./index.ts";
import { assertEquals } from "jsr:@std/assert";

Deno.test("serialize and deserialize ArrayBuffer", () => {
  const x = new ArrayBuffer(8);
  const y = deserialize(serialize(x));
  assertEquals(y, x);
});
