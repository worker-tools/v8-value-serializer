import { Buffer } from 'node:buffer';
import { ValueSerializer, ValueSerializerDelegate, ValueDeserializer, ValueDeserializerDelegate } from "jsr:@workers/v8-value-serializer-core@^0.1.9";

// This file has no direct C++ equivalent, it's a mishmash of the following files, 
// with the goal of making node's v8 module (v8.js) work without modification.
// - https://github.com/nodejs/node/blob/main/src/node_serdes.cc
// - https://github.com/nodejs/node/blob/main/deps/v8/src/d8/d8.cc

interface ISerializer {
  _getDataCloneError: typeof Error;
  _setTreatArrayBufferViewsAsHostObjects(value: boolean): void;
  releaseBuffer(): Buffer;
  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void;
  writeDouble(value: number): void;
  writeHeader(): void;
  writeRawBytes(value: ArrayBufferView): void;
  writeUint32(value: number): void;
  writeUint64(hi: number, lo: number): void;
  writeValue(value: any): void;
}

interface IDeserializer {
  readonly buffer: ArrayBufferView;
  _readRawBytes(length: number): number;
  getWireFormatVersion(): number;
  readDouble(): number;
  readHeader(): boolean;
  readRawBytes(length: number): Buffer;
  readUint32(): number;
  readUint64(): [hi: number, lo: number];
  readValue(): unknown;
  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer | SharedArrayBuffer): void;
}

type SerializationData = {
  data?: Uint8Array;
  // backingStores: ArrayBuffer[];
  // sabBackingStores: SharedArrayBuffer[];
  // compiledWasmModules: Array<any>;
  // sharedValueConveyor?: any;
};

export abstract class Serializer implements ISerializer, ValueSerializerDelegate {
  private serializer: ValueSerializer;
  private data: SerializationData | null;
  // private arrayBuffers: ArrayBuffer[];
  // private sharedArrayBuffers: SharedArrayBuffer[];
  // private currentMemoryUsage: number;

  constructor() {
    this.serializer = new ValueSerializer(this);
    this.data = null;
    // this.arrayBuffers = [];
    // this.sharedArrayBuffers = [];
    // this.currentMemoryUsage = 0;
  }

  abstract _writeHostObject(object: unknown): any;

  abstract _getDataCloneError: typeof Error;

  abstract _getSharedArrayBufferId(_sab: SharedArrayBuffer): number|null;

  _setTreatArrayBufferViewsAsHostObjects(value: boolean) {
    this.serializer.setTreatArrayBufferViewsAsHostObjects(value);
  }

  writeHeader() {
    this.serializer.writeHeader();
  }

  writeValue(value: any): boolean {
    this.data = {
      // backingStores: [],
      // sabBackingStores: [],
      // compiledWasmModules: [],
    };
    // if (!this.prepareTransfer(transfer)) {
    //   return false;
    // }

    // this.serializer.writeHeader();

    if (!this.serializer.writeObject(value)) {
      this.data = null;
      return false;
    }

    // if (!this.finalizeTransfer()) {
    //   return false;
    // }

    const data = this.serializer.release();
    this.data.data = data;
    return true;
  }

  releaseBuffer(): Buffer {
    const buffer = this.data!.data!;
    return Buffer.from(buffer);
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer) {
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw Error('arrayBuffer must be an ArrayBuffer or SharedArrayBuffer');
    }
    this.serializer.transferArrayBuffer(id, arrayBuffer);
  }

  writeUint32(value: number) {
    this.serializer.writeUint32(value);
  }

  writeUint64(hi: number, lo: number): void {
    const bi = BigInt(hi) << 32n | BigInt(lo);
    this.serializer.writeUint64(bi);
  }

  writeUint64_(value: bigint) {
    this.serializer.writeUint64(value);
  }

  writeDouble(value: number) {
    this.serializer.writeDouble(value);
  }

  writeRawBytes(source: ArrayBufferView|DataView) {
    if (!ArrayBuffer.isView(source)) {
      throw Error('source must be a TypedArray or DataView');
    }
    if (source instanceof Uint8Array) {
      this.serializer.writeRawBytes(source);
    } else {
      this.serializer.writeRawBuffer(source.buffer, source.byteOffset, source.byteLength);
    }
  }

  writeRawBytes_(buffer: BufferSource) {
    const bytes = buffer instanceof Uint8Array 
      ? buffer 
      : 'buffer' in buffer 
        ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) 
        : new Uint8Array(buffer);
    this.serializer.writeRawBytes(bytes);
  }

  // appendBackingStoresTo(to: ArrayBuffer[]): void {
  //   to.push(...this.arrayBuffers);
  //   this.arrayBuffers = [];
  // }

  throwDataCloneError(message: string): never {
    throw new (this._getDataCloneError || Error)(message);
  }

  getSharedArrayBufferId(sharedArrayBuffer: SharedArrayBuffer): number {
    if (typeof this._getSharedArrayBufferId !== 'function') {
      throw new TypeError('Subclass does not implement _getSharedArrayBufferId');
    }
    const id = this._getSharedArrayBufferId(sharedArrayBuffer);
    if (id == null || !Number.isInteger(Number(id)) || Number(id) >>> 0 !== Number(id)) throw Error('getSharedArrayBufferId() failed');
    return id;
  }

  reallocateBufferMemory(_oldBuffer: ArrayBuffer, size: number): ArrayBuffer {
    // this.currentMemoryUsage += size;
    return new ArrayBuffer(size);
  }

  writeHostObject(object: unknown): boolean {
    if (typeof this._writeHostObject !== 'function') {
      throw new TypeError('Subclass does not implement _writeHostObject');
    }
    this._writeHostObject(object);
    return true
  }

  get hasCustomHostObjects(): false { return false };

  isHostObject(_object: unknown): boolean {
    // Shouldn't be necessary due to `treatArrayBufferViewsAsHostObjects`
    return false
  };
}

export abstract class Deserializer implements IDeserializer, ValueDeserializerDelegate {
  private deserializer: ValueDeserializer;
  private data: Uint8Array;
  // private arrayBuffers: ArrayBuffer[];
  // private sharedArrayBuffers: SharedArrayBuffer[];

  constructor(buffer: Buffer | ArrayBufferView | DataView) {
    const data = this.data = buffer instanceof ArrayBuffer 
      ? new Uint8Array(buffer) 
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.deserializer = new ValueDeserializer(data, this);
    // this.arrayBuffers = [];
    // this.sharedArrayBuffers = [];
  }

  abstract _readHostObject(): unknown;

  readHostObject(): object {
    if (typeof this._readHostObject !== 'function') {
      throw new TypeError('Subclass does not implement _writeHostObject');
    }
    const ret = this._readHostObject();
    if (ret == null || typeof ret !== 'object') {
      throw TypeError('readHostObject must return an object');
    }
    return ret;
  }

  readHeader(): boolean {
    return this.deserializer.readHeader();
  }

  readValue(): any {
    return this.deserializer.readObjectWrapper();
  }

  transferArrayBuffer(id: number, arrayBuffer: ArrayBuffer): void {
    if (!(arrayBuffer instanceof ArrayBuffer)) {
      throw Error('arrayBuffer must be an ArrayBuffer or SharedArrayBuffer');
    }
    this.deserializer.transferArrayBuffer(id, arrayBuffer);
  }

  getWireFormatVersion(): number {
    const v = this.deserializer.wireFormatVersion;
    if (!v) throw Error('getWireFormatVersion() failed');
    return v;
  }

  readUint32(): number {
    const n =  this.deserializer.readUint32()!;
    if (!n) throw Error('readUint32() failed');
    return n;
  }

  readUint64(): [hi: number, low: number] {
    const bi = this.deserializer.readUint64()!;
    if (!bi) throw Error('readUint64() failed');
    return [Number(bi >> 32n), Number(bi & 0xFFFFFFFFn)];
  }

  readUint64_(): bigint {
    const value = this.deserializer.readUint64()!;
    if (!value) throw Error('readUint64_() failed');
    return value;
  }

  readDouble(): number {
    const value = this.deserializer.readDouble();
    if (!value) throw Error('readDouble() failed');
    return value;
  }

  _readRawBytes(length: number): number {
    const offset = this.deserializer.readRawBytesNoAlloc(length);
    if (offset == null) throw Error('readRawBytes() failed');
    return offset;
  }

  readRawBytes(length: number): Buffer {
    const bytes = this.deserializer.readRawBytes(length);
    if (bytes == null) throw Error('readRawBytes() failed');
    return Buffer.from(bytes);
  }

  get buffer(): Uint8Array {
    return this.data;
  }

  getSharedArrayBufferFromId(_cloneId: number): SharedArrayBuffer|null {
    throw Error('Not implemented');
  }
}
