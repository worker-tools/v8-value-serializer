import { 
  ArrayBufferViewTag, 
  ValueDeserializer, 
  ValueDeserializerDelegate, 
  ValueSerializer, 
  ValueSerializerDelegate
} from "jsr:@workers/v8-value-serializer-core@^0.1.5";

function copy(source: Uint8Array, dest: Uint8Array, destStart: number, sourceStart: number, sourceEnd: number) {
  dest.set(source.subarray(sourceStart, sourceEnd), destStart);
}

function arrayBufferViewTypeToIndex(abView: object): number {
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
  if (abView instanceof BigInt64Array) return 11;
  if (abView instanceof BigUint64Array) return 12;
  // if (abView instanceof Int8Array) return ArrayBufferViewTag.kInt8Array;
  // if (abView instanceof Uint8Array) return ArrayBufferViewTag.kUint8Array;
  // if (abView instanceof Uint8ClampedArray) return ArrayBufferViewTag.kUint8ClampedArray;
  // if (abView instanceof Int16Array) return ArrayBufferViewTag.kInt16Array;
  // if (abView instanceof Uint16Array) return ArrayBufferViewTag.kUint16Array;
  // if (abView instanceof Int32Array) return ArrayBufferViewTag.kInt32Array;
  // if (abView instanceof Uint32Array) return ArrayBufferViewTag.kUint32Array;
  // if (abView instanceof globalThis.Float16Array) return ArrayBufferViewTag.kFloat16Array;
  // if (abView instanceof Float32Array) return ArrayBufferViewTag.kFloat32Array;
  // if (abView instanceof Float64Array) return ArrayBufferViewTag.kFloat64Array;
  // if (abView instanceof BigInt64Array) return ArrayBufferViewTag.kBigInt64Array;
  // if (abView instanceof BigUint64Array) return ArrayBufferViewTag.kBigUint64Array;
  // if (abView instanceof DataView) return ArrayBufferViewTag.kDataView;
  return -1;
}

function arrayBufferViewIndexToType(index: number|null): ((new () => ArrayBufferView)|DataViewConstructor) & {BYTES_PER_ELEMENT?: number}|undefined {
  switch (index) {
    case 0: return Int8Array;
    case 1: return Uint8Array;
    case 2: return Uint8ClampedArray;
    case 3: return Int16Array;
    case 4: return Uint16Array;
    case 5: return Int32Array;
    case 6: return Uint32Array;
    case 7: return Float32Array;
    case 8: return Float64Array;
    case 9: return DataView;
    case 10: return Uint8Array;
    case 11: return BigInt64Array;
    case 12: return BigUint64Array;
    case ArrayBufferViewTag.kInt8Array: return Int8Array;
    case ArrayBufferViewTag.kUint8Array: return Uint8Array;
    case ArrayBufferViewTag.kUint8ClampedArray: return Uint8ClampedArray;
    case ArrayBufferViewTag.kInt16Array: return Int16Array;
    case ArrayBufferViewTag.kUint16Array: return Uint16Array;
    case ArrayBufferViewTag.kInt32Array: return Int32Array;
    case ArrayBufferViewTag.kUint32Array: return Uint32Array;
    case ArrayBufferViewTag.kFloat16Array: return globalThis.Float16Array;
    case ArrayBufferViewTag.kFloat32Array: return Float32Array;
    case ArrayBufferViewTag.kFloat64Array: return Float64Array;
    case ArrayBufferViewTag.kBigInt64Array: return BigInt64Array;
    case ArrayBufferViewTag.kBigUint64Array: return BigUint64Array;
    case ArrayBufferViewTag.kDataView: return DataView;
    default: return undefined;
  }
}

/** Customize behavior of the serializer. */
export interface SerializerOptions {
  /** Will always encode strings as UTF-8. This can have positive effects on perf, but will mangle strings that aren't well-formed. */
  forceUtf8?: boolean
  /** Arrays in JS can have non-integer keys. Checking for these is slow in JS userland and this options disables it.   */
  ignoreArrayProperties?: boolean
};

export class Serializer implements ValueSerializerDelegate {
  protected serializer: ValueSerializer;
  protected data: Uint8Array | null;

  constructor(options?: SerializerOptions) {
    this.serializer = new ValueSerializer(this);
    this.serializer.setForceUtf8(options?.forceUtf8 ?? false);
    this.serializer.setIgnoreArrayProperties(options?.ignoreArrayProperties ?? false);
    this.serializer.setTreatArrayBufferViewsAsHostObjects(true);
    this.data = null;
  }

  throwDataCloneError(message: string): never {
    throw new DOMException(message, 'DataCloneError');
  }

  writeHeader() {
    this.serializer.writeHeader();
  }

  writeValue(value: any): boolean {
    if (!this.serializer.writeObject(value)) {
      this.data = null;
      return false;
    }
    const data = this.serializer.release();
    this.data = data;
    return true;
  }

  releaseBuffer(): Uint8Array {
    return this.data!;
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer) {
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw Error('arrayBuffer must be an ArrayBuffer or SharedArrayBuffer');
    }
    this.serializer.transferArrayBuffer(id, arrayBuffer);
  }

  getSharedArrayBufferId(_sharedArrayBuffer: SharedArrayBuffer): number {
    throw new Error('Not implemented');
  }

  reallocateBufferMemory(_oldBuffer: ArrayBuffer, size: number): ArrayBuffer {
    return new ArrayBuffer(size);
  }

  writeHostObject(object: object): boolean {
    // Keep track of how to handle different ArrayBufferViews. The default
    // Serializer for Node does not use the V8 methods for serializing those
    // objects because Node's `Buffer` objects use pooled allocation in many
    // cases, and their underlying `ArrayBuffer`s would show up in the
    // serialization. Because a) those may contain sensitive data and the user
    // may not be aware of that and b) they are often much larger than the
    // `Buffer` itself, custom serialization is applied.
    let i = 1;  // Uint8Array
    if (!(object instanceof Uint8Array)) {
      i = arrayBufferViewTypeToIndex(object);
      if (i === -1) {
        this.throwDataCloneError(`Unserializable host object: ${object}`);
      }
    }
    const abView = object as ArrayBufferView;
    this.serializer.writeUint32(i);
    this.serializer.writeUint32(abView.byteLength);
    this.serializer.writeRawBuffer(abView.buffer, abView.byteOffset, abView.byteLength);
    return true
  }

  get hasCustomHostObjects(): boolean { return false };

  isHostObject(object: unknown): boolean {
    // Shouldn't be necessary due to `hasCustomHostObjects`
    return false
  };

  serialize(value: any): Uint8Array {
    this.writeHeader();
    this.writeValue(value);
    return this.releaseBuffer();
  }
}

/** Customize behavior of the serializer. */
export interface DeserializerOptions {
  /** This will treat 2-byte strings as UTF-16. This can significantly improve performance, but requires that all strings were well-formed during encoding. */
  forceUtf16?: boolean
}

export class Deserializer implements ValueDeserializerDelegate {
  protected deserializer: ValueDeserializer;
  protected buffer: Uint8Array;

  constructor(buffer: BufferSource, options?: DeserializerOptions) {
    const data = this.buffer = buffer instanceof Uint8Array 
      ? buffer
      : buffer instanceof ArrayBuffer 
        ? new Uint8Array(buffer) 
        : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.deserializer = new ValueDeserializer(data, this);
    this.deserializer.setForceUtf16(options?.forceUtf16 ?? false);
    this.readHeader();
  }

  readHostObject(): object|null {
    const tag = this.deserializer.readUint32();
    if (tag === null) return null;
    return this.readHostObjectForTag(tag);
  }

  protected readHostObjectForTag(tag: number): object|null {
    const Ctor = arrayBufferViewIndexToType(tag);
    if (!Ctor) return null;
    const byteLength = this.deserializer.readUint32();
    if (!byteLength) return null;
    const byteOffset = this.deserializer.readRawBytesNoAlloc(byteLength);
    if (!byteOffset) return null;
    const BYTES_PER_ELEMENT = Ctor.BYTES_PER_ELEMENT || 1;

    const offset = this.buffer.byteOffset + byteOffset;
    if (offset % BYTES_PER_ELEMENT === 0) {
      return new Ctor(this.buffer.buffer, offset, byteLength / BYTES_PER_ELEMENT);
    }
    // Copy to an aligned buffer first.
    const bufferCopy = new Uint8Array(byteLength);
    copy(this.buffer, bufferCopy, 0, byteOffset, byteOffset + byteLength);
    return new Ctor(bufferCopy.buffer, bufferCopy.byteOffset, byteLength / BYTES_PER_ELEMENT);
  }

  readHeader(): boolean {
    return this.deserializer.readHeader();
  }

  readValue(): any {
    return this.deserializer.readObjectWrapper();
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void {
    this.deserializer.transferArrayBuffer(id, arrayBuffer);
  }

  get wireFormatVersion(): number {
    return this.deserializer.wireFormatVersion!;
  }

  getSharedArrayBufferFromId(_cloneId: number): SharedArrayBuffer|null {
    throw Error('Not implemented');
  }

  deserialize(): any {
    return this.readValue();
  }
}
