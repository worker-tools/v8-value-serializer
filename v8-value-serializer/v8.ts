import { Serializer, Deserializer } from "./node-serdes.ts";

//#region lib
function ObjectPrototypeToString(obj: unknown): string {
  return Object.prototype.toString.call(obj);
}

function copy(source: Uint8Array, dest: Uint8Array, destStart: number, sourceStart: number, sourceEnd: number) {
  dest.set(source.subarray(sourceStart, sourceEnd), destStart);
}
//#endregion

/* V8 serialization API with `Buffer` replaced by `Uint8Array` */

function arrayBufferViewTypeToIndex(abView: ArrayBufferView): number {
  const type = ObjectPrototypeToString(abView);
  if (type === '[object Int8Array]') return 0;
  if (type === '[object Uint8Array]') return 1;
  if (type === '[object Uint8ClampedArray]') return 2;
  if (type === '[object Int16Array]') return 3;
  if (type === '[object Uint16Array]') return 4;
  if (type === '[object Int32Array]') return 5;
  if (type === '[object Uint32Array]') return 6;
  if (type === '[object Float32Array]') return 7;
  if (type === '[object Float64Array]') return 8;
  if (type === '[object DataView]') return 9;
  // Index 10 is default.
  if (type === '[object BigInt64Array]') return 11;
  if (type === '[object BigUint64Array]') return 12;
  return -1;
}

function arrayBufferViewIndexToType(index: number|null): ((new () => ArrayBufferView)|(DataViewConstructor)) & {BYTES_PER_ELEMENT?: number} {
  if (index === 0) return Int8Array;
  if (index === 1) return Uint8Array;
  if (index === 2) return Uint8ClampedArray;
  if (index === 3) return Int16Array;
  if (index === 4) return Uint16Array;
  if (index === 5) return Int32Array;
  if (index === 6) return Uint32Array;
  if (index === 7) return Float32Array;
  if (index === 8) return Float64Array;
  if (index === 9) return DataView;
  if (index === 10) return Uint8Array;
  if (index === 11) return BigInt64Array;
  if (index === 12) return BigUint64Array;
  // @ts-expect-error
  return undefined;
}

/**
 * A subclass of {@link Serializer} that serializes `TypedArray` (in particular `Uint8Array`) and `DataView` objects as host objects, 
 * and only stores the part of their underlying ArrayBuffers that they are referring to.
 */
class DefaultSerializer extends Serializer {
  constructor() {
    super();

    this._setTreatArrayBufferViewsAsHostObjects(true);
  }

  _writeHostObject(abView: ArrayBufferView): void {
    let i = 10;  // FastBuffer
    if (!(abView instanceof Uint8Array)) {
      i = arrayBufferViewTypeToIndex(abView);
      if (i === -1) {
        throw new this._getDataCloneError(
          `Unserializable host object: ${abView}`);
      }
    }
    this.writeUint32(i);
    this.writeUint32(abView.byteLength);
    this.writeRawBytes(new Uint8Array(abView.buffer,
                                      abView.byteOffset,
                                      abView.byteLength));
  }

  get _getDataCloneError(): typeof Error { return Error };
  _getSharedArrayBufferId(_sab: SharedArrayBuffer): never {
    throw new Error("Method not implemented.");
  }
}

/**
 * A subclass of {@link Deserializer} corresponding to the format written by {@link DefaultSerializer}. 
 */
class DefaultDeserializer extends Deserializer {
  _readHostObject(): any {
    const typeIndex = this.readUint32();
    const ctor = arrayBufferViewIndexToType(typeIndex);
    const byteLength = this.readUint32();
    const byteOffset = this._readRawBytes(byteLength);
    const BYTES_PER_ELEMENT = ctor.BYTES_PER_ELEMENT || 1;

    const offset = this.buffer.byteOffset + byteOffset;
    if (offset % BYTES_PER_ELEMENT === 0) {
      return new ctor(this.buffer.buffer,
                      offset,
                      byteLength / BYTES_PER_ELEMENT);
    }
    // Copy to an aligned buffer first.
    const buffer_copy = new Uint8Array(byteLength);
    copy(this.buffer, buffer_copy, 0, byteOffset, byteOffset + byteLength);
    return new ctor(buffer_copy.buffer,
                    buffer_copy.byteOffset,
                    byteLength / BYTES_PER_ELEMENT);
  }
}

/**
 * Uses a {@link DefaultSerializer} to serialize `value` into a buffer.
 */
function serialize(value: any): Uint8Array {
  const ser = new DefaultSerializer();
  ser.writeHeader();
  ser.writeValue(value);
  return ser.releaseBuffer();
}

/**
 * Uses a {@link DefaultDeserializer} with default options to read a JavaScript value from a buffer.
 */
function deserialize(buffer: ArrayBufferView | DataView): any {
  const der = new DefaultDeserializer(buffer);
  der.readHeader();
  return der.readValue();
}

export {
  Serializer,
  Deserializer,
  DefaultSerializer,
  DefaultDeserializer,
  deserialize,
  serialize,
};
