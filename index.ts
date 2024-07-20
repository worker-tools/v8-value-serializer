import { ValueDeserializer, ValueDeserializerDelegate, ValueSerializer, ValueSerializerDelegate } from "./v8-value-serializer.ts";

function copy(source: Uint8Array, dest: Uint8Array, destStart: number, sourceStart: number, sourceEnd: number) {
  dest.set(source.subarray(sourceStart, sourceEnd), destStart);
}

function arrayBufferViewTypeToIndex(abView: ArrayBufferView): number {
  if (abView instanceof Int8Array) return 0;
  if (abView instanceof Uint8Array) return 1;
  if (abView instanceof Uint8ClampedArray) return 2;
  if (abView instanceof Int16Array) return 3;
  if (abView instanceof Uint16Array) return 4;
  if (abView instanceof Int32Array) return 5;
  if (abView instanceof Uint32Array) return 6;
  if (abView instanceof Float32Array) return 7;
  if (abView instanceof Float64Array) return 8;
  if (abView instanceof DataView) return 9;
  // Index 10 is FastBuffer.
  if (abView instanceof BigInt64Array) return 11;
  if (abView instanceof BigUint64Array) return 12;
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

export interface SerializerOptions {
  /** Will always encode strings as UTF-8. This can have positive effects on perf, but will mangle strings that aren't well-formed. */
  forceUtf8?: boolean
  /** Arrays in JS can have non-integer keys. Checking for these is slow in JS userland and this options disables it.   */
  ignoreArrayProperties?: boolean
};

class Serializer implements ValueSerializerDelegate {
  #serializer: ValueSerializer;
  #data: Uint8Array | null;

  constructor(options?: SerializerOptions) {
    this.#serializer = new ValueSerializer(this);
    this.#serializer.setForceUtf8(options?.forceUtf8 ?? false);
    this.#serializer.setIgnoreArrayProperties(options?.ignoreArrayProperties ?? false);
    this.#serializer.setTreatArrayBufferViewsAsHostObjects(true);
    this.#data = null;
  }

  throwDataCloneError(message: string): never {
    throw new DOMException(message, 'DataCloneError');
  }

  #writeHeader() {
    this.#serializer.writeHeader();
  }

  #writeValue(value: any): boolean {
    if (!this.#serializer.writeObject(value)) {
      this.#data = null;
      return false;
    }
    const data = this.#serializer.release();
    this.#data = data;
    return true;
  }

  #releaseBuffer() {
    return this.#data!;
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer) {
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw Error('arrayBuffer must be an ArrayBuffer or SharedArrayBuffer');
    }
    this.#serializer.transferArrayBuffer(id, arrayBuffer);
  }

  getSharedArrayBufferId(_sharedArrayBuffer: SharedArrayBuffer): number {
    throw new Error('Not implemented');
  }

  reallocateBufferMemory(_oldBuffer: ArrayBuffer, size: number): ArrayBuffer {
    return new ArrayBuffer(size);
  }

  writeHostObject(abView: ArrayBufferView): boolean {
    // Keep track of how to handle different ArrayBufferViews. The default
    // Serializer for Node does not use the V8 methods for serializing those
    // objects because Node's `Buffer` objects use pooled allocation in many
    // cases, and their underlying `ArrayBuffer`s would show up in the
    // serialization. Because a) those may contain sensitive data and the user
    // may not be aware of that and b) they are often much larger than the
    // `Buffer` itself, custom serialization is applied.
    let i = 1;  // Uint8Array
    if (!(abView instanceof Uint8Array)) {
      i = arrayBufferViewTypeToIndex(abView);
      if (i === -1) {
        this.throwDataCloneError(`Unserializable host object: ${abView}`);
      }
    }
    this.#serializer.writeUint32(i);
    this.#serializer.writeUint32(abView.byteLength);
    this.#serializer.writeRawBuffer(abView.buffer, abView.byteOffset, abView.byteLength);
    return true
  }

  get hasCustomHostObjects() { return false };

  isHostObject(_object: unknown): boolean {
    // Shouldn't be necessary due to `hasCustomHostObjects`
    return false
  };

  serialize(value: any): Uint8Array {
    this.#writeHeader();
    this.#writeValue(value);
    return this.#releaseBuffer();
  }
}

export interface DeserializerOptions {
  forceUtf16?: boolean
}

class Deserializer implements ValueDeserializerDelegate {
  #deserializer: ValueDeserializer;
  #buffer: Uint8Array;

  constructor(buffer: BufferSource, options?: DeserializerOptions) {
    const data = this.#buffer = buffer instanceof Uint8Array 
      ? buffer
      : buffer instanceof ArrayBuffer 
        ? new Uint8Array(buffer) 
        : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.#deserializer = new ValueDeserializer(data, this);
    this.#deserializer.setForceUtf16(options?.forceUtf16 ?? false);
  }

  #readUint32(): number {
    const n =  this.#deserializer.readUint32()!;
    if (!n) throw new DOMException('', 'DataCloneError');
    return n;
  }

  readHostObject() {
    const typeIndex = this.#readUint32();
    const Ctor = arrayBufferViewIndexToType(typeIndex);
    const byteLength = this.#readUint32();
    const byteOffset = this.#deserializer.readRawBytesNoAlloc(byteLength)!;
    const BYTES_PER_ELEMENT = Ctor.BYTES_PER_ELEMENT || 1;

    const offset = this.#buffer.byteOffset + byteOffset;
    if (offset % BYTES_PER_ELEMENT === 0) {
      return new Ctor(this.#buffer.buffer, offset, byteLength / BYTES_PER_ELEMENT);
    }
    // Copy to an aligned buffer first.
    const bufferCopy = new Uint8Array(byteLength);
    copy(this.#buffer, bufferCopy, 0, byteOffset, byteOffset + byteLength);
    return new Ctor(bufferCopy.buffer, bufferCopy.byteOffset, byteLength / BYTES_PER_ELEMENT);
  }

  #readHeader(): boolean {
    return this.#deserializer.readHeader();
  }

  #readValue(): any {
    return this.#deserializer.readObjectWrapper();
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void {
    this.#deserializer.transferArrayBuffer(id, arrayBuffer);
  }

  get wireFormatVersion(): number {
    const v = this.#deserializer.wireFormatVersion;
    if (!v) throw Error('getWireFormatVersion() failed');
    return v;
  }

  getSharedArrayBufferFromId(_cloneId: number): SharedArrayBuffer|null {
    throw Error('Not implemented');
  }

  deserialize(): any {
    this.#readHeader();
    return this.#readValue();
  }
}

export function serialize(value: any, options: SerializerOptions): Uint8Array {
  return new Serializer(options).serialize(value);
}

export function deserialize(buffer: BufferSource, options?: DeserializerOptions): any {
  return new Deserializer(buffer, options).deserialize();
}
