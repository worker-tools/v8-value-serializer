// import { ShadowRealm } from "@scope/shadow-realm/index.ts";
import serdes from 'npm:serdes'
import * as CBOR from 'npm:cbor-x';
import * as ungap from 'npm:@ungap/structured-clone';
import * as SJSON from 'npm:@worker-tools/structured-json';
import { pack, unpack } from "npm:msgpackr";

import { ValueDeserializer, ValueSerializer } from "./v8-value-serializer.ts";
import * as V8 from 'node:v8';

const typicalObjet = generateRandomObject(5, 5)
console.log("# properties:", countProperties(typicalObjet))

// const realm = new ShadowRealm();
// export const __fnToString = (fn: any) => fn.toString()
// realm.evaluate(__fnToString(async () => {
//   const { Buffer } = await import('npm:buffer');
//   (globalThis as any).Buffer = Buffer;
// }));
// const serdesBrowser = await realm.importValue('npm:serdes', 'default');

const encoder = new CBOR.Encoder({ structuredClone: true, useRecords: false, structures: undefined, pack: false, tagUint8Array: true, largeBigIntToFloat: false });
Deno.bench("ser:cbor-x", { group: 'ser' }, () => {
  encoder.encode(typicalObjet)
})

Deno.bench("ser:serialize", { group: 'ser', baseline: true }, () => {
  const ser = new ValueSerializer()
  ser.writeHeader();
  ser.writeObject(typicalObjet);
  ser.release()
})

Deno.bench("ser:serdes", { group: 'ser' }, () => {
  serdes.serialize(typicalObjet)
})

// Deno.bench("ser:serdes-browserify", { group: 'ser' }, () => {
//   serdesBrowser.serialize(typicalObjet)
// })

Deno.bench("ser:v8", { group: 'ser' }, () => {
  V8.serialize(typicalObjet)
})

Deno.bench("ser:json", { group: 'ser' }, () => {
  JSON.stringify(typicalObjet)
})

Deno.bench("ser:ungap+pack", { group: 'ser' }, () => {
  pack(ungap.serialize(typicalObjet))
});

Deno.bench("ser:sjson+pack", { group: 'ser' }, () => {
  pack(SJSON.encapsulate(typicalObjet))
});


const typicalBuffer = V8.serialize(typicalObjet);
const typicalOldBuffer = serdes.serialize(typicalObjet);
const typicalCBOR = encoder.encode(typicalObjet);
const typicalPackedUngap = pack(ungap.serialize(typicalObjet));
const typicalStringUngap = JSON.stringify(ungap.serialize(typicalObjet));
const typicalString = JSON.stringify(typicalObjet);
const typicalPackedSJSON = pack(SJSON.stringify(typicalObjet));

const decoder = new CBOR.Decoder({ structuredClone: true, useRecords: false, structures: undefined, pack: false, tagUint8Array: true, largeBigIntToFloat: false });

Deno.bench("des:deserialize", { group: "des", baseline: true }, () => {
  const ser = new ValueDeserializer(typicalBuffer);
  ser.readHeader();
  ser.readObjectWrapper();
});

Deno.bench("des:deserialize-f", { group: "des", baseline: true }, () => {
  const ser = new ValueDeserializer(typicalBuffer, undefined);
  ser.setForceUtf16(true);
  ser.readHeader();
  ser.readObjectWrapper();
});

Deno.bench("des:cbor-x", { group: "des", baseline: false }, () => {
  decoder.decode(typicalCBOR);
});

Deno.bench("des:serdes", { group: "des", baseline: false }, () => {
  serdes.deserialize(typicalOldBuffer);
});

Deno.bench("des:v8", { group: "des", baseline: false }, () => {
  V8.deserialize(typicalBuffer);
});

Deno.bench("des:ungap+pack", { group: "des", baseline: false }, () => {
  ungap.deserialize(unpack(typicalPackedUngap));
});

Deno.bench("des:sjson+pack", { group: "des", baseline: false }, () => {
  SJSON.revive(unpack(typicalPackedSJSON));
});

Deno.bench("des:json", { group: "des", baseline: false }, () => {
  JSON.parse(typicalString);
});

Deno.bench("des:ungap+json", { group: "des", baseline: false }, () => {
  ungap.serialize(JSON.parse(typicalStringUngap));
});

// await new Promise(resolve => setTimeout(resolve, 5000));
// const start = Date.now();
// while (true) {
//   const ser = new ValueDeserializer(typicalBuffer);
//   ser.readHeader();
//   ser.readObjectWrapper();
//   if (start + 5000 < Date.now()) break;
// }

const longStr = Math.random().toString(36).substring(2).repeat(5000);
const longStrBytes = Uint8Array.from({ length: longStr.length }, (_: any, i: number) => longStr.charCodeAt(i))
const longStrBytes16 = Uint16Array.from({ length: longStr.length }, (_: any, i: number) => longStr.charCodeAt(i))

Deno.bench("cbor-x", { group: 'str' }, () => {
  encoder.encode(longStr)
})

Deno.bench("serialize", { group: 'str' }, () => {
  const ser = new ValueSerializer()
  ser.writeHeader();
  ser.writeObject(longStr);
  ser.release()
})

const longArr = [...crypto.getRandomValues(new Uint8Array(4096))]

Deno.bench("cbor-x", { group: 'arr' }, () => {
  encoder.encode(longArr)
})

Deno.bench("serialize", { group: 'arr' }, () => {
  const ser = new ValueSerializer()
  ser.writeHeader();
  ser.writeObject(longArr);
  ser.release()
})

// Deno.bench('fromCharCode', { group: 'formCharCode' }, () => {
//   String.fromCharCode(...longStrBytes)
// })

// Deno.bench('fromCharCode undef', { group: 'formCharCode' }, () => {
//   String.fromCharCode.apply(undefined, longStrBytes as any)
// })

// Deno.bench('fromCharCode null', { group: 'formCharCode' }, () => {
//   String.fromCharCode.apply(null, longStrBytes as any)
// })

// Deno.bench('fromCharCode chunked', { group: 'formCharCode' }, () => {
//   stringFromCharCode(longStrBytes)
// })

// Deno.bench('fromCharCode 16', { group: 'formCharCode' }, () => {
//   String.fromCharCode.apply(undefined, longStrBytes16 as any)
// })

// Deno.bench('TextEncoder.encode', { group: 'textEncoding' }, () => {
//   new TextEncoder().encode(longStr)
// })

// Deno.bench('encodeWTF16Into', { group: 'textEncoding' }, () => {
//   encodeWTF16Into(longStr, new Uint16Array(longStr.length))
// })

const string32 = longStr.substring(0, 32);
const string64 = longStr.substring(0, 64);
const string128 = longStr.substring(0, 128);
const string256 = longStr.substring(0, 256);
Deno.bench('n-code 32', { group: 'n-code' }, () => { new TextEncoder().encode(string32) })
Deno.bench('n-code 64', { group: 'n-code' }, () => { new TextEncoder().encode(string64) })
Deno.bench('n-code 128', { group: 'n-code' }, () => { new TextEncoder().encode(string128) })
Deno.bench('n-code 256', { group: 'n-code' }, () => { new TextEncoder().encode(string256) })

// await new Promise(resolve => setTimeout(resolve, 5000));
// const start = Date.now()
// while (true) {
//   for (const obj of testCases) {
//     ser.writeHeader();
//     ser.writeObject(obj);
//     ser.release()
//   }
//   if (start + 5000 < Date.now()) break;
// }


// const ser = new ValueSerializer()
// ser.writeHeader();
// ser.writeObject(new WeakMap());
// const actual = Buffer.from(ser.release())
// console.log(actual)
// console.log(deserialize(actual))

// const obj = [0n]
// const buff = serialize(obj)
// const ser = new ValueSerializer()
// ser.writeHeader()
// ser.writeObject(obj)
// console.log('me', Buffer.from(ser.release()))
// console.log('v8', buff)
// const der = new ValueDeserializer(buff)
// console.log(der.readHeader());
// console.log(der.readObjectWrapper())
// // console.log(deserialize(buff))

function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = characters.slice(0, -10)[randomInt(0, 52)];
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateRandomValue(primitive = true): any {
  const types = ['string', 'wtf-16', 'integer', 'number', 'boolean', 'null'];
  if (!primitive) types.push('array');
  const type = types[Math.floor(Math.random() * types.length)];
  
  switch (type) {
      case 'string':
          return generateRandomString(randomInt(0, 100));
      case 'wtf-16':
          return String.fromCharCode.apply(undefined, crypto.getRandomValues(new Uint16Array(randomInt(0, 1000))) as any);
      case 'integer':
          return randomInt(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      case 'number':
          return Math.random() * Number.MAX_VALUE
      case 'boolean':
          return Math.random() < 0.5;
      case 'array':
          return Array.from({ length: randomInt(0, 10) }, () => generateRandomValue(false));
      case 'undefined':
          return undefined;
      case 'null':
      default:
          return null;
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomObject(breadth: number, depth: number) {
  if (depth === 0) {
      return generateRandomValue();
  }

  const obj: any = {};
  for (let i = 0, len = randomInt(1, breadth); i < len; i++) {
      const key = generateRandomString(randomInt(1, 16)); // Generate random key
      obj[key] = generateRandomValue();
  }
  for (let i = 0, len = randomInt(1, breadth); i < len; i++) {
      const key = generateRandomString(randomInt(1, 16)); // Generate random key
      obj[key] = generateRandomObject(breadth, depth - 1);
  }

  return obj;
}

function countProperties(obj: any) {
  let count = 0;

  function countNestedProperties(obj: any) {
    if (Array.isArray(obj)) {
      count += obj.length;
      for (let i = 0; i < obj.length; i++) {
        countNestedProperties(obj[i]);
      }
    }
    else if (obj !== null && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          count++;
          countNestedProperties(obj[key]);
        }
      }
    }
  }

  countNestedProperties(obj);
  return count;
}
