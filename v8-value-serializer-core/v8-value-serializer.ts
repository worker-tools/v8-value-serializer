export const kLatestVersion = 15;

export enum SerializationTag {
  // version:uint32_t (if at beginning of data, sets version > 0)
  kVersion = 0xFF,
  // ignore
  kPadding = 0x00,
  // refTableSize:uint32_t (previously used for sanity checks; safe to ignore)
  kVerifyObjectCount = 63, // '?'
  // Oddballs (no data).
  kTheHole = 45, // '-'
  kUndefined = 95, // '_'
  kNull = 48, // '0'
  kTrue = 84, // 'T'
  kFalse = 70, // 'F'
  // Number represented as 32-bit integer, ZigZag-encoded
  // (like sint32 in protobuf)
  kInt32 = 73, // 'I'
  // Number represented as 32-bit unsigned integer, varint-encoded
  // (like uint32 in protobuf)
  kUint32 = 85, // 'U'
  // Number represented as a 64-bit double.
  // Host byte order is used (N.B. this makes the format non-portable).
  kDouble = 78, // 'N'
  // BigInt. Bitfield:uint32_t, then raw digits storage.
  kBigInt = 90, // 'Z'
  // byteLength:uint32_t, then raw data
  kUtf8String = 83, // 'S'
  kOneByteString = 34, // '"'
  kTwoByteString = 99, // 'c'
  // Reference to a serialized object. objectID:uint32_t
  kObjectReference = 94, // '^'
  // Beginning of a JS object.
  kBeginJSObject = 111, // 'o'
  // End of a JS object. numProperties:uint32_t
  kEndJSObject = 123, // '{'
  // Beginning of a sparse JS array. length:uint32_t
  // Elements and properties are written as key/value pairs, like objects.
  kBeginSparseJSArray = 97, // 'a'
  // End of a sparse JS array. numProperties:uint32_t length:uint32_t
  kEndSparseJSArray = 64, // '@'
  // Beginning of a dense JS array. length:uint32_t
  // |length| elements, followed by properties as key/value pairs
  kBeginDenseJSArray = 65, // 'A'
  // End of a dense JS array. numProperties:uint32_t length:uint32_t
  kEndDenseJSArray = 36, // '$'
  // Date. millisSinceEpoch:double
  kDate = 68, // 'D'
  // Boolean object. No data.
  kTrueObject = 121, // 'y'
  kFalseObject = 120, // 'x'
  // Number object. value:double
  kNumberObject = 110, // 'n'
  // BigInt object. Bitfield:uint32_t, then raw digits storage.
  kBigIntObject = 122, // 'z'
  // String object, UTF-8 encoding. byteLength:uint32_t, then raw data.
  kStringObject = 115, // 's'
  // Regular expression, UTF-8 encoding. byteLength:uint32_t, raw data,
  // flags:uint32_t.
  kRegExp = 82, // 'R'
  // Beginning of a JS map.
  kBeginJSMap = 59, // ';'
  // End of a JS map. length:uint32_t.
  kEndJSMap = 58, // ':'
  // Beginning of a JS set.
  kBeginJSSet = 39, // "'"
  // End of a JS set. length:uint32_t.
  kEndJSSet = 44, // ','
  // Array buffer. byteLength:uint32_t, then raw data.
  kArrayBuffer = 66, // 'B'
  // Resizable ArrayBuffer.
  kResizableArrayBuffer = 126, // '~'
  // Array buffer (transferred). transferID:uint32_t
  kArrayBufferTransfer = 116, // 't'
  // View into an array buffer.
  // subtag:ArrayBufferViewTag, byteOffset:uint32_t, byteLength:uint32_t
  // For typed arrays, byteOffset and byteLength must be divisible by the size
  // of the element.
  // Note: kArrayBufferView is special, and should have an ArrayBuffer (or an
  // ObjectReference to one) serialized just before it. This is a quirk arising
  // from the previous stack-based implementation.
  kArrayBufferView = 86, // 'V'
  // Shared array buffer. transferID:uint32_t
  kSharedArrayBuffer = 117, // 'u'
  // A HeapObject shared across Isolates. sharedValueID:uint32_t
  kSharedObject = 112, // 'p'
  // A wasm module object transfer. next value is its index.
  kWasmModuleTransfer = 119, // 'w'
  // The delegate is responsible for processing all following data.
  // This "escapes" to whatever wire format the delegate chooses.
  kHostObject = 92, // '\\'
  // A transferred WebAssembly.Memory object. maximumPages:int32_t, then by
  // SharedArrayBuffer tag and its data.
  kWasmMemoryTransfer = 109, // 'm'
  // A list of (subtag: ErrorTag, [subtag dependent data]). See ErrorTag for
  // details.
  kError = 114, // 'r'

  // The following tags are reserved because they were in use in Chromium before
  // the kHostObject tag was introduced in format version 13, at
  //   v8           refs/heads/master@{#43466}
  //   chromium/src refs/heads/master@{#453568}
  //
  // They must not be reused without a version check to prevent old values from
  // starting to deserialize incorrectly. For simplicity, it's recommended to
  // avoid them altogether.
  //
  // This is the set of tags that existed in SerializationTag.h at that time and
  // still exist at the time of this writing (i.e., excluding those that were
  // removed on the Chromium side because there should be no real user data
  // containing them).
  //
  // It might be possible to also free up other tags which were never persisted
  // (e.g. because they were used only for transfer) in the future.
  kLegacyReservedMessagePort = 77, // 'M'
  kLegacyReservedBlob = 98, // 'b'
  kLegacyReservedBlobIndex = 105, // 'i'
  kLegacyReservedFile = 102, // 'f'
  kLegacyReservedFileIndex = 101, // 'e'
  kLegacyReservedDOMFileSystem = 100, // 'd'
  kLegacyReservedFileList = 108, // 'l'
  kLegacyReservedFileListIndex = 76, // 'L'
  kLegacyReservedImageData = 35, // '#'
  kLegacyReservedImageBitmap = 103, // 'g'
  kLegacyReservedImageBitmapTransfer = 71, // 'G'
  kLegacyReservedOffscreenCanvas = 72, // 'H'
  kLegacyReservedCryptoKey = 75, // 'K'
  kLegacyReservedRTCCertificate = 107, // 'k'
}

export enum ArrayBufferViewTag {
  kInt8Array = 98, // 'b'
  kUint8Array = 66, // 'B'
  kUint8ClampedArray = 67, // 'C'
  kInt16Array = 119, // 'w'
  kUint16Array = 87, // 'W'
  kInt32Array = 100, // 'd'
  kUint32Array = 68, // 'D'
  kFloat16Array = 104, // 'h'
  kFloat32Array = 102, // 'f'
  kFloat64Array = 70, // 'F'
  kBigInt64Array = 113, // 'q'
  kBigUint64Array = 81, // 'Q'
  kDataView = 63, // '?'
}

// Sub-tags only meaningful for error serialization.
export enum ErrorTag {
  // The error is a EvalError. No accompanying data.
  kEvalErrorPrototype = 69, // 'E'
  // The error is a RangeError. No accompanying data.
  kRangeErrorPrototype = 82, // 'R'
  // The error is a ReferenceError. No accompanying data.
  kReferenceErrorPrototype = 70, // 'F'
  // The error is a SyntaxError. No accompanying data.
  kSyntaxErrorPrototype = 83, // 'S'
  // The error is a TypeError. No accompanying data.
  kTypeErrorPrototype = 84, // 'T'
  // The error is a URIError. No accompanying data.
  kUriErrorPrototype = 85, // 'U'
  // Followed by message: string.
  kMessage = 109, // 'm'
  // Followed by a JS object: cause.
  kCause = 99, // 'c'
  // Followed by stack: string.
  kStack = 115, // 's'
  // The end of this error information.
  kEnd = 46, // '.'
}

//#region Helpers
type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | typeof globalThis.Float16Array
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

const TypedArray = Object.getPrototypeOf(Uint8Array);

function isTypedArray(value: unknown): value is ArrayBufferView {
  return value instanceof TypedArray;
}

function isResizableArrayBuffer(buffer: ArrayBuffer) {
  return 'resizable' in buffer && buffer.resizable
}

function isGrowableSharedArrayBuffer(buffer: SharedArrayBuffer) {
  return 'growable' in buffer && buffer.growable
}

const SM_MIN = -(2 ** 30);  // -2^30
const SM_MAX = 2 ** 30 - 1; // 2^30 - 1

const FixedArrayMaxLength = 2^30 - 1

function isSmi(value: number): value is number {
  return value >= SM_MIN && value <= SM_MAX;
}

function getRegExpFlags(regexp: RegExp): number {
  let flags = 0;
  if (regexp.global) flags |= 1 << 0; // global flag
  if (regexp.ignoreCase) flags |= 1 << 1; // ignoreCase flag
  if (regexp.multiline) flags |= 1 << 2; // multiline flag
  if (regexp.sticky) flags |= 1 << 3; // sticky flag
  if (regexp.unicode) flags |= 1 << 4; // unicode flag
  if (regexp.dotAll) flags |= 1 << 5; // dotAll flag
  return flags;
}

function bytesNeededForVarInt(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Only unsigned integer types can be written as varints.');
  }
  let result = 0;
  do {
    result++;
    value >>>= 7;
  } while (value);
  return result;
}

function getBigIntBitfieldForSerialization(b: bigint) {
  // In order to make the serialization format the same on 32/64 bit builds,
  // we convert the length-in-digits to length-in-bytes for serialization.
  // Being able to do this depends on having enough LengthBits:
  // static_assert(kMaxLength * kDigitSize <= LengthBits::kMax);
  // FIXME: Add back the length assert above. This is probably produces incorrect results for absurdly large BigInts
  const signBit = b < 0n ? 1 : 0;
  const byteLength = calcBigIntSerializationByteLength(b);
  return signBit << 0 | byteLength << 1;
}

function calcBigIntSerializationByteLength(bigint: bigint): number {
  let bitLength = 0;

  let temp = bigint < 0n ? -bigint : bigint;
  while (temp > 0n) {
      temp >>= 1n;
      bitLength++;
  }

  // Round to nearest 8
  const byteLength = (bitLength + 7) >> 3;
  const adjustedByteLength = (byteLength + 7) & ~7;
  return adjustedByteLength;
}

function clz64(n: bigint) {
  if (n <= 0n) {
      return 64; // For non-positive values, return 64 as the maximum number of leading zeros
  }
  let count = 0n;
  let bitMask = 1n << 63n; // Start with the highest bit in a 64-bit number
  while ((n & bitMask) === 0n) {
      count++;
      bitMask >>= 1n;
  }
  return Number(count);
}

function encodeWTF16Into(string: string, dest: Uint16Array) {
  for (let i = 0, len = string.length; i < len; i++) {
    dest[i] = string.charCodeAt(i);
  }
}

// There's a limit to the number of arguments that can be passed to String.fromCharCode, picking one that should work everywhere:
const StringFromCharCodeChunkSize = 0x8000; // 32768
function stringFromCharCode(bytes: Uint8Array|Uint16Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += StringFromCharCodeChunkSize) {
    const chunk = bytes.subarray(i, i + StringFromCharCodeChunkSize);
    result += String.fromCharCode.apply(null, chunk as any);
  }
  return result;
}
//#endregion

export interface ValueSerializerDelegate {
  /**
   * Handles the case where a DataCloneError would be thrown in the structured
   * clone spec. Other V8 embedders may throw some other appropriate exception
   * type.
   */
  throwDataCloneError(message: string): never;

  /**
   * The embedder overrides this method to enable custom host object filter
   * with Delegate::IsHostObject.
   *
   * This method is called at most once per serializer.
   */
  readonly hasCustomHostObjects: boolean;

  /**
   * The embedder overrides this method to determine if an JS object is a
   * host object and needs to be serialized by the host.
   */
  isHostObject(object: object): boolean|null;

  /**
   * The embedder overrides this method to write some kind of host object, if
   * possible. If not, a suitable exception should be thrown and
   * Nothing<boolean>() returned.
   */
  writeHostObject(object: object): boolean|null;

  /**
   * Called when the ValueSerializer is going to serialize a
   * SharedArrayBuffer object. The embedder must return an ID for the
   * object, using the same ID if this SharedArrayBuffer has already been
   * serialized in this buffer. When deserializing, this ID will be passed to
   * ValueDeserializer::GetSharedArrayBufferFromId as |clone_id|.
   *
   * If the object cannot be serialized, an
   * exception should be thrown and Nothing<uint32_t>() returned.
   */
  getSharedArrayBufferId(sharedArrayBuffer: SharedArrayBuffer): number;

  // getWasmModuleTransferId(module: WebAssembly.Module): number;

  // /**
  //  * Called when the first shared value is serialized. All subsequent shared
  //  * values will use the same conveyor.
  //  *
  //  * The embedder must ensure the lifetime of the conveyor matches the
  //  * lifetime of the serialized data.
  //  *
  //  * If the embedder supports serializing shared values, this method should
  //  * return true. Otherwise the embedder should throw an exception and return
  //  * false.
  //  *
  //  * This method is called at most once per serializer.
  //  */
  // adoptSharedValueConveyor(conveyor: SharedValueConveyor): boolean|null;

  /**
   * Allocates memory for the buffer of at least the size provided. The actual
   * size (which may be greater or equal) is written to |actual_size|. If no
   * buffer has been allocated yet, nullptr will be provided.
   *
   * If the memory cannot be allocated, nullptr should be returned.
   * |actual_size| will be ignored. It is assumed that |old_buffer| is still
   * valid in this case and has not been modified.
   *
   * The default implementation uses the stdlib's `realloc()` function.
   */
  reallocateBufferMemory(oldBuffer: ArrayBuffer, size: number): ArrayBuffer;
}

export class ValueSerializer {
  private buffer: ArrayBuffer;
  private bytes: Uint8Array;
  private size: number = 0;
  private bufferCapacity: number = 0;
  private treatArrayBufferViewsAsHostObjects = false;
  private hasCustomHostObjects = false;

  private nextId: number = 0;
  private idMap: Map<object, number> = new Map();

  private arrayBufferTransferMap = new Map<ArrayBuffer, number>();

  constructor(
    private delegate?: ValueSerializerDelegate,
  ) {
    this.buffer = new ArrayBuffer(0);
    this.bytes = new Uint8Array(this.buffer);
    this.hasCustomHostObjects = this.delegate?.hasCustomHostObjects ?? false;
  }
  
  private _view?: DataView;
  private get view() {
    return this._view ??= new DataView(this.buffer);
  }

  writeHeader(): void {
    this.writeTag(SerializationTag.kVersion);
    this.writeVarInt(kLatestVersion);
  }

  setForceUtf8(mode: boolean): void {
    this.forceUtf8 = mode;
  }

  setIgnoreArrayProperties(mode: boolean): void {
    this.ignoreArrayProperties = mode;
  }

  setTreatArrayBufferViewsAsHostObjects(mode: boolean): void {
    this.treatArrayBufferViewsAsHostObjects = mode;
  }

  private writeTag(tag: SerializationTag): void {
    this.writeRawUint8(tag);
  }

  private writeRawUint8(byte: number) {
    this.ensureCapacity(1);
    this.bytes[this.size] = byte;
    this.size++;
  }

  private writeVarInt(value: number): void {
    // Writes an unsigned integer as a base-128 varint.
    // The number is written, 7 bits at a time, from the least significant to the
    // most significant 7 bits. Each byte, except the last, has the MSB set.
    // See also https://developers.google.com/protocol-buffers/docs/encoding

    // const length = value && Math.ceil(Math.log2(value) / 7) + 1
    const length = ((32 - Math.clz32(value) + 6) / 7) | 0;

    this.ensureCapacity(length);

    let nextByteIndex = 0;
    do {
      this.bytes[this.size + nextByteIndex] = (value & 0x7F) | 0x80;
      nextByteIndex++;
      value >>>= 7;
    } while (value);
    this.bytes[this.size + nextByteIndex - 1] &= 0x7F;

    this.size += nextByteIndex;
  }

  private writeVarInt64(value: bigint): void {
    // same as above, but using bigint math
    const length = ((32 - clz64(value) + 6) / 7) | 0;

    this.ensureCapacity(length);

    let nextByteIndex = 0;
    do {
      this.bytes[this.size + nextByteIndex] = Number((value & 0x7Fn) | 0x80n);
      nextByteIndex++;
      value >>= 7n;
    } while (value);
    this.bytes[this.size + nextByteIndex - 1] &= 0x7F;

    this.size += nextByteIndex;
  }

  private writeZigZag(value: number): void {
    const unsignedValue = (value << 1) ^ (value >> (32 - 1));
    this.writeVarInt(unsignedValue);
  }

  private writeRawFloat64(value: number) {
    this.ensureCapacity(8);
    this.view.setFloat64(this.size, value, true);
    this.size += 8;
  }

  writeDouble(value: number): void {
    this.writeRawFloat64(value);
  }

  private writeBigIntContents(bigint: bigint): void {
    const bitfield = getBigIntBitfieldForSerialization(bigint)
    const byteLength = bitfield >>> 1;
    this.writeVarInt(bitfield);
    this.ensureCapacity(byteLength);
    let index = 0;
    while (bigint > 0) {
      this.bytes[this.size + (index++)] = Number(bigint & 0xFFn);
      bigint >>= 8n;
    }
    this.size += byteLength;
  }

  writeRawBytes(source: Uint8Array, length: number = source.length): void {
    this.ensureCapacity(length);
    if (length < source.length) {
      this.bytes.set(source.subarray(0, length), this.size);
    } else {
      this.bytes.set(source, this.size);
    }
    this.size += length;
  }

  writeRawBuffer(source: ArrayBuffer, byteOffset: number, byteLength: number): void {
    this.ensureCapacity(byteLength);
    this.bytes.set(new Uint8Array(source, byteOffset, byteLength), this.size);
    this.size += byteLength;
  }

  private ensureCapacity(bytes: number) {
    const oldSize = this.size;
    const newSize = oldSize + bytes;
    if (newSize > this.bufferCapacity) {
      this.expandBuffer(newSize);
    }
  }

  private reserveRawBytes(bytes: number): Uint8Array {
    const oldSize = this.size;
    const newSize = oldSize + bytes;
    if (newSize > this.bufferCapacity) {
      this.expandBuffer(newSize);
    }
    this.size = newSize;
    return this.bytes.subarray(oldSize, newSize);
  }

  private reserveRawBytesAsUint16Array(bytes: number): Uint16Array {
    const oldSize = this.size;
    const newSize = oldSize + bytes;
    if (newSize > this.bufferCapacity) {
      this.expandBuffer(newSize);
    }
    this.size = newSize;
    return new Uint16Array(this.buffer, oldSize, bytes / 2);
  }

  private expandBuffer(requiredCapacity: number): void {
    const requestedCapacity = Math.max(requiredCapacity, this.bufferCapacity * 2) + 64;
    let newBuffer;
    if (this.delegate) {
      newBuffer = this.delegate.reallocateBufferMemory(this.buffer, requestedCapacity);
    } else {
      newBuffer = new ArrayBuffer(requestedCapacity);
    }
    const newBytes = new Uint8Array(newBuffer);
    if (this.buffer) {
      newBytes.set(this.bytes);
    }
    this.buffer = newBuffer;
    this.bytes = newBytes
    this.bufferCapacity = requestedCapacity;
    this._view = undefined; // invalidate the view
  }

  writeByte(value: number): void {
    this.writeRawUint8(value);
  }

  writeUint32(value: number): void {
    this.writeVarInt(value);
  }

  writeUint64(value: bigint): void {
    this.writeVarInt64(value);
  }

  // XXX: Maybe just prevent further writes instead of resetting?
  release(): Uint8Array {
    const bytes = this.bytes.subarray(0, this.size);
    this.bytes = new Uint8Array(0);
    this.buffer = this.bytes.buffer;
    this._view = undefined; // invalidate the view
    this.size = 0;
    this.bufferCapacity = 0;
    this.idMap = new Map();
    this.nextId = 0;
    return bytes;
  }

  transferArrayBuffer(transferId: number, arrayBuffer: ArrayBuffer): void {
    // Ensure the array buffer is not already in the transfer map
    if (this.arrayBufferTransferMap.has(arrayBuffer)) {
      throw new Error('ArrayBuffer is already in the transfer map');
    }

    // Ensure the array buffer is not shared (assuming we have a way to check this in JS)
    if (arrayBuffer instanceof SharedArrayBuffer) {
      throw new Error('SharedArrayBuffer cannot be transferred');
    }

    this.arrayBufferTransferMap.set(arrayBuffer, transferId);
  }

  writeObject(object: unknown): boolean {
    if (object == null || typeof object === 'boolean') {
      this.writeOddball(object);
      return true;
    }
    if (typeof object === 'number') {
      if (isSmi(object)) {
        this.writeSmi(object);
        return true;
      }
      this.writeHeapNumber(object);
      return true;
    }
    if (typeof object === 'bigint') {
      this.writeBigInt(object);
      return true;
    }
    if (isTypedArray(object) || object instanceof DataView) {
      // Despite being JSReceivers, these have their wrapped buffer serialized
      // first. That makes this logic a little quirky, because it needs to
      // happen before we assign object IDs.
      const view = object;
      if (!this.idMap.has(view) && !this.treatArrayBufferViewsAsHostObjects) {
        const buffer = view.buffer;
        if (!this.writeJSReceiver(buffer)) return false;
      }
      return this.writeJSReceiver(view);
    }
    if (typeof object === 'string') {
      this.writeString(object);
      return true;
    }
    if (typeof object === 'object' || typeof object === 'function') {
      return this.writeJSReceiver(object);
    }

    return this.throwDataCloneError(object);
  }

  private writeOddball(oddball: boolean|null|undefined): void {
    let tag: SerializationTag;
    if (oddball === undefined) 
      tag = SerializationTag.kUndefined;
    else if (oddball === false)
      tag = SerializationTag.kFalse;
    else if (oddball === true)
      tag = SerializationTag.kTrue;
    else if (oddball === null)
      tag = SerializationTag.kNull;
    else
      throw new Error('Unreachable code');
    this.writeTag(tag);
  }
  
  private writeSmi(smi: number): void {
    this.writeTag(SerializationTag.kInt32);
    this.writeZigZag(smi);
  }
  
  private writeHeapNumber(number: number): void {
    this.writeTag(SerializationTag.kDouble);
    this.writeDouble(number);
  }
  
  private writeBigInt(bigint: bigint): void {
    this.writeTag(SerializationTag.kBigInt);
    this.writeBigIntContents(bigint);
  }

  private te = new TextEncoder();
  private forceUtf8 = false;

  private writeString(str: string): boolean {
    // Older versions of the protocol supported UTF-8 strings. It was likely removed because it breaks certain WTF-16 strings,
    // or because it's faster for V8 to dump its internal string representation. 
    // However, it's still being decoded and for JS userland it's performance improvement if we don't care about edge cases, since
    // TextEncoder appears to be faster than constant charCodeAt...
    if (this.forceUtf8) {
      this.writeTag(SerializationTag.kUtf8String);
      // Can't use encodeInto because we need to know the length in advance :(
      const utf8Bytes = this.te.encode(str);
      this.writeVarInt(utf8Bytes.length);
      this.ensureCapacity(utf8Bytes.length);
      this.bytes.set(utf8Bytes, this.size);
      this.size += utf8Bytes.length;
      return true;
    }

    const startingBufferSize = this.size;

    // We don't have access to internal properties that tell us in advance if the string is 1-byte encoded, so we just try...
    // In the worst case, we have a long ASCII string with one non-ascii char at the end... for these we encode everything twice.
    // Otherwise, if there's special chars in a long string we'll find out about it pretty soon and switch to WTF-16.
    let chunkSize = 128; // No point is testing less than 128 chars, costs about the same... at least on my machine
    let offset = 0;

    this.writeTag(SerializationTag.kOneByteString);
    this.writeVarInt(str.length);
  
    let bailed = false;
    while (offset < str.length) {
      const currentChunkSize = Math.min(chunkSize, str.length - offset);
      const currentChunk = str.substring(offset, offset + currentChunkSize);
  
      const dest = this.reserveRawBytes(currentChunk.length);
      const { read, written } = this.te.encodeInto(currentChunk, dest);
      if (written !== currentChunk.length || read !== written) {
        // It wasn't ASCII, bailing out.
        // Note that this also bails on latin-1 strings, which would still be encoded as one-byte in V8, but whatever.
        bailed = true;
        break;
      }
  
      offset += currentChunkSize;
      chunkSize *= 2; // We try increasingly large chunks, on the assumption that probability decreases each time.
    }
    if (!bailed) return true;

    this.size = startingBufferSize;

    // Just dump WTF-16. Unfortunately, this is not particularly fast in userland.
    const byteLength = str.length * 2;

    // The existing reading code expects 16-byte strings to be aligned.
    if ((this.size + 1 + bytesNeededForVarInt(byteLength)) & 1) {
      this.writeTag(SerializationTag.kPadding);
    }
    this.writeTag(SerializationTag.kTwoByteString);
    this.writeVarInt(byteLength);
    const dest = this.reserveRawBytesAsUint16Array(byteLength);
    encodeWTF16Into(str, dest);
    return true;
  }
  
    private writeJSReceiver(receiver: object): boolean {
    // If the object has already been serialized, just write its ID.
    const foundId = this.idMap.get(receiver);
    if (foundId !== undefined) {
      this.writeTag(SerializationTag.kObjectReference);
      this.writeVarInt(foundId - 1);
      return true;
    }
  
    // Otherwise, allocate an ID for it.
    const id = this.nextId++;
    this.idMap.set(receiver, id + 1);

    // Eliminate callable and exotic objects, which should not be serialized.
    // if (this.isCallable(receiver) || (this.isSpecialReceiverInstanceType(instanceType) &&
    //                                   instanceType !== InstanceType.JS_SPECIAL_API_OBJECT_TYPE)) {
    // HACK: Simplified condition, not sure if correct (UPDATE: It is not)
    if (
      typeof receiver === 'function' || 
      receiver instanceof Promise ||
      receiver instanceof WeakMap ||
      receiver instanceof WeakSet ||
      receiver instanceof WeakRef // TODO: There's more
    ) {
      return this.throwDataCloneError(receiver);
    }
  
    if (Array.isArray(receiver)) {
      return this.writeJSArray(receiver);
    }
    // TODO: How to efficiently check for special api objects?
    // if (InstanceType.SPECIAL_API_OBJECT_TYPE) {
    //   return this.writeHostObject(receiver);
    // }
    if (receiver instanceof Date) {
      this.writeJSDate(receiver);
      return true;
    }
    if (receiver instanceof Boolean || receiver instanceof String || receiver instanceof Number || receiver instanceof BigInt || receiver instanceof Symbol) {
      return this.writeJSPrimitiveWrapper(receiver);
    } 
    if (receiver instanceof RegExp) {
      this.writeJSRegExp(receiver);
      return true;
    }
    if (receiver instanceof Map) {
      return this.writeJSMap(receiver);
    } 
    if (receiver instanceof Set) {
      return this.writeJSSet(receiver);
    } 
    if (receiver instanceof ArrayBuffer || receiver instanceof SharedArrayBuffer) {
      return this.writeJSArrayBuffer(receiver);
    } 
    if (isTypedArray(receiver) || receiver instanceof DataView) {
      return this.writeJSArrayBufferView(receiver);
    } 
    if (receiver instanceof Error) {
      return this.writeJSError(receiver);
    } 
    if (typeof receiver === 'object') {
      const jsObject = receiver;
      const isHostObject = this.isHostObject(jsObject);
      if (isHostObject === null) {
        return false;
      }
      if (isHostObject) {
        return this.writeHostObject(jsObject);
      } else {
        return this.writeJSObject(jsObject);
      }
    }

    // XXX: Should this be supported?
    // case InstanceType.SHARED_ARRAY_TYPE:
    //   return this.writeJSSharedArray(receiver);
    // case InstanceType.SHARED_STRUCT_TYPE:
    //   return this.writeJSSharedStruct(receiver);
    // case InstanceType.ATOMICS_MUTEX_TYPE:
    // case InstanceType.ATOMICS_CONDITION_TYPE:
    //   return this.writeSharedObject(receiver);

    // XXX: Should this be supported?
    // case WASM_MODULE_OBJECT_TYPE:
    //   return WriteWasmModule(Cast<WasmModuleObject>(receiver));
    // case WASM_MEMORY_OBJECT_TYPE:
    //   return WriteWasmMemory(Cast<WasmMemoryObject>(receiver));
  
    return this.throwDataCloneError(receiver);
  }

  private writeJSObject(object: object) {
    this.writeTag(SerializationTag.kBeginJSObject);
    
    const propertiesWritten = this.writeJSObjectProperties(object);

    this.writeTag(SerializationTag.kEndJSObject);
    this.writeVarInt(propertiesWritten);
    return true;
  }

  private ignoreArrayProperties = false;

  private writeJSArray(array: unknown[]): boolean {
    const startingBufferSize = this.size;

    const length = array.length;

    // NOTE: In the V8 code there there would be a check here to see if the array is "hole-y". We don't have access to that in userland,
    // so instead we optimistically assume a dense array and bail when we encounter a hole.
    // Needless to say this is pretty bad perf for hole-y arrays, but if people use those they must already expect that anyway.
    // XXX: This produces slightly different results compared to v8 when there's holes, but it decodes correctly.
    this.writeTag(SerializationTag.kBeginDenseJSArray);
    this.writeVarInt(length);
    let i = 0;

    // XXX: Perhaps it's faster to check all elements first and then write them in a loop?
    // if (array.every((el: unknown) => typeof el === 'number' && Number.isInteger(el))) {
    //   for (i = 0; i < length; i++) {
    //     this.writeSmi(array[i] as number);
    //   }
    // } else if (array.every((el: unknown) => typeof el === 'number' && !Number.isInteger(el))) {
    //   for (i = 0; i < length; i++) {
    //     this.writeTag(SerializationTag.kDouble);
    //     this.writeDouble(array[i] as number);
    //   }
    // } else if (Array.isArray(array)) {
    //   for (i = 0; i < length; i++) {
    //     if (!this.writeObject(array[i])) return false;
    //   }
    // }

    let bailed = false;
    for (i = 0; i < length; i++) {
      if (!(i in array)) {
        bailed = true;
        break;
      }
      const element = array[i];
      if (typeof element === 'number') {
        if (isSmi(element)) {
          this.writeSmi(element);
        } else {
          this.writeTag(SerializationTag.kDouble);
          this.writeDouble(element);
        }
      } else {
        if (!this.writeObject(element)) return false;
      }
    }

    if (!bailed) {
      // If there are elements remaining, serialize them slowly.
      for (; i < array.length; i++) {
        // Serializing the array's elements can have arbitrary side effects, so we
        // cannot rely on still having fast elements, even if it did to begin
        // with.
        if (!(i in array)) {
          this.writeTag(SerializationTag.kTheHole);
          continue;
        }
        const element = array[i];
        if (!this.writeObject(element)) return false;
      }

      let propertiesWritten = 0;
      // XXX: If the array has more keys than `length`, there must be additional properties
      // This is terrible for perf, but afaik there's no better way to check if the array has additional properties.
      // I'm wondering if it would be better to just always use the "slow" path. 
      if (!this.ignoreArrayProperties) {
        const keys = Object.keys(array);
        if (keys.length !== array.length) {
          propertiesWritten = this.writeJSObjectPropertiesNonNumericKeys(array, keys);
        }
      }

      this.writeTag(SerializationTag.kEndDenseJSArray);
      this.writeVarInt(propertiesWritten);
      this.writeVarInt(length);
    } else {
      this.size = startingBufferSize;

      this.writeTag(SerializationTag.kBeginSparseJSArray);
      this.writeVarInt(length);
      
      const propertiesWritten = this.writeJSObjectProperties(array);
      
      this.writeTag(SerializationTag.kEndSparseJSArray);
      this.writeVarInt(propertiesWritten);
      this.writeVarInt(length);
    }
    return true;
  }

  private writeJSDate(date: Date) {
    this.writeTag(SerializationTag.kDate);
    this.writeDouble(date.getTime());
  }

  private writeJSRegExp(regexp: RegExp) {
    this.writeTag(SerializationTag.kRegExp);
    this.writeString(regexp.source);
    this.writeVarInt(getRegExpFlags(regexp));
  }
  
  private writeJSMap(jsMap: Map<any, any>): boolean {
    // First copy the key-value pairs, since getters could mutate them.
    const entries = [...jsMap.entries()]

    // Then write it out.
    this.writeTag(SerializationTag.kBeginJSMap);
    for (const [key, value] of entries) {
      if (!this.writeObject(key) || !this.writeObject(value)) {
        return false;
      }
    }
    this.writeTag(SerializationTag.kEndJSMap);
    this.writeVarInt(entries.length * 2);
    return true;
  }

  private writeJSSet(jsSet: Set<any>): boolean {
    // First copy the element pointers, since getters could mutate them.
    const values = [...jsSet.values()]

    // Then write it out.
    this.writeTag(SerializationTag.kBeginJSSet);
    for (const value of values) {
      if (!this.writeObject(value)) {
        return false;
      }
    }
    this.writeTag(SerializationTag.kEndJSSet);
    this.writeVarInt(values.length);
    return true;
  }

  private writeJSArrayBuffer(arrayBuffer: ArrayBuffer | SharedArrayBuffer): boolean {
    if (arrayBuffer instanceof SharedArrayBuffer) {
      if (!this.delegate) {
        return this.throwDataCloneError(arrayBuffer);
      }

      const index = this.delegate.getSharedArrayBufferId(arrayBuffer);
      this.writeTag(SerializationTag.kSharedArrayBuffer);
      this.writeVarInt(index);
      return true;
    }

    const transferEntry = this.arrayBufferTransferMap.get(arrayBuffer);
    if (transferEntry !== undefined) {
      this.writeTag(SerializationTag.kArrayBufferTransfer);
      this.writeVarInt(transferEntry);
      return true;
    }

    const byteLength = arrayBuffer.byteLength;
    if (byteLength > Number.MAX_SAFE_INTEGER) {
      return this.throwDataCloneError(arrayBuffer);
    }

    if ('resizable' in arrayBuffer && arrayBuffer.resizable) {
      const maxByteLength = (arrayBuffer as any).maxByteLength;
      if (maxByteLength > Number.MAX_SAFE_INTEGER) {
        return this.throwDataCloneError(arrayBuffer);
      }

      this.writeTag(SerializationTag.kResizableArrayBuffer);
      this.writeVarInt(byteLength);
      this.writeVarInt(maxByteLength);
      this.writeRawBuffer(arrayBuffer, 0, byteLength);
      return true;
    }

    this.writeTag(SerializationTag.kArrayBuffer);
    this.writeVarInt(byteLength);
    this.writeRawBuffer(arrayBuffer, 0, byteLength);
    return true;
  }

  private getArrayBufferViewTag(view: ArrayBufferView): ArrayBufferViewTag {
    if (view instanceof Uint8Array) {
      return ArrayBufferViewTag.kUint8Array;
    } else if (view instanceof Int8Array) {
      return ArrayBufferViewTag.kInt8Array;
    } else if (view instanceof Uint8ClampedArray) {
      return ArrayBufferViewTag.kUint8ClampedArray;
    } else if (view instanceof Int16Array) {
      return ArrayBufferViewTag.kInt16Array;
    } else if (view instanceof Uint16Array) {
      return ArrayBufferViewTag.kUint16Array;
    } else if (view instanceof Int32Array) {
      return ArrayBufferViewTag.kInt32Array;
    } else if (view instanceof Uint32Array) {
      return ArrayBufferViewTag.kUint32Array;
    } else if ('Float16Array' in globalThis && view instanceof globalThis.Float16Array) {
      return ArrayBufferViewTag.kFloat16Array;
    } else if (view instanceof Float32Array) {
      return ArrayBufferViewTag.kFloat32Array;
    } else if (view instanceof Float64Array) {
      return ArrayBufferViewTag.kFloat64Array;
    } else if (view instanceof BigInt64Array) {
      return ArrayBufferViewTag.kBigInt64Array;
    } else if (view instanceof BigUint64Array) {
      return ArrayBufferViewTag.kBigUint64Array;
    } else {
      this.throwDataCloneError(view);
    }
  }

  private writeJSArrayBufferView(view: ArrayBufferView|DataView) {
    if (this.treatArrayBufferViewsAsHostObjects) {
      return this.writeHostObject(view);
    }
    this.writeTag(SerializationTag.kArrayBufferView);

    let tag: ArrayBufferViewTag|undefined;
    if (isTypedArray(view)) {
      // NOTE: Here we are supposed to check for out of bounds, but AFAIK we can't replicate this check in userland. 
      // A view that has gone out of bounds is set to length 0 and is indistinguishable from an empty view. 
      // Since we can't throw on empty views, we just include it. 
      // We could work around this by doing something silly like `structuredClone(view)` just to bait the exception, but no thanks.
      // if (view.isOutOfBounds()) { return this.throwDataCloneError(MessageTemplate.kDataCloneError, view); }
      tag = this.getArrayBufferViewTag(view)
    } else {
      // See comment above.
      // if (view instanceof JSRabGsabDataView && view.isOutOfBounds()) { return this.throwDataCloneError(MessageTemplate.kDataCloneError, view); }
      tag = ArrayBufferViewTag.kDataView;
    }

    this.writeVarInt(tag);
    this.writeVarInt(view.byteOffset);
    this.writeVarInt(view.byteLength);
    const flags = 
      0 | // (isLengthTracking(view.buffer) ? 1 : 0) | // XXX: Can we know this in JS?
      (isResizableArrayBuffer(view.buffer) ? 2 : 0);
    this.writeVarInt(flags);
    return true;
  }

  private getErrorTagFor(name: string) {
    switch (name) {
      case 'EvalError':
        return ErrorTag.kEvalErrorPrototype;
      case 'RangeError':
        return ErrorTag.kRangeErrorPrototype;
      case 'ReferenceError':
        return ErrorTag.kReferenceErrorPrototype;
      case 'SyntaxError':
        return ErrorTag.kSyntaxErrorPrototype;
      case 'TypeError':
        return ErrorTag.kTypeErrorPrototype;
      case 'URIError':
        return ErrorTag.kUriErrorPrototype;
      default:
        // The default prototype in the deserialization side is Error.prototype, so
        // we don't have to do anything here.
    }
  }

  private writeJSError(error: any) {
    const messageDesc = Object.getOwnPropertyDescriptor(error, 'message');
    const causeDesc = Object.getOwnPropertyDescriptor(error, 'cause');

    this.writeTag(SerializationTag.kError);

    const name = error.name || 'Error';
    const errorTag = this.getErrorTagFor(name);
    if (errorTag) {
      this.writeVarInt(errorTag);
    }

    if (messageDesc && messageDesc.value !== undefined) {
      this.writeVarInt(ErrorTag.kMessage);
      this.writeString(messageDesc.value);
    }

    const stack = error.stack;
    if (typeof stack === 'string') {
      this.writeVarInt(ErrorTag.kStack);
      this.writeString(stack);
    }

    if (causeDesc && causeDesc.value !== undefined) {
      this.writeVarInt(ErrorTag.kCause);
      if (!this.writeObject(causeDesc.value)) {
        return false;
      }
    }

    this.writeVarInt(ErrorTag.kEnd);
    return true;
  }

  private writeJSPrimitiveWrapper(value: Boolean|Number|BigInt|String|Symbol) {
    if (value instanceof Boolean) {
      if (value.valueOf()) {
        this.writeTag(SerializationTag.kTrueObject);
      } else {
        this.writeTag(SerializationTag.kFalseObject);
      }
    } else if (value instanceof Number) {
      this.writeTag(SerializationTag.kNumberObject);
      this.writeDouble(value.valueOf());
    } else if (value instanceof BigInt) {
      this.writeTag(SerializationTag.kBigIntObject);
      this.writeBigIntContents(value.valueOf());
    } else if (value instanceof String) {
      this.writeTag(SerializationTag.kStringObject);
      this.writeString(value.valueOf());
    } else {
      if (value instanceof Symbol) {
        return this.throwDataCloneError(value);
      }
      throw new Error('Unexpected primitive wrapper type');
    }
    return true;
  }

  private writeHostObject(object: object): boolean {
    this.writeTag(SerializationTag.kHostObject);
    if (!this.delegate) {
      this.throwDataCloneError(object);
    }
    try {
      this.delegate.writeHostObject(object);
    } catch (err) {
      this.throwDataCloneError(object);
    }
    return true;
  }

  private writeJSObjectProperties(object: any): number {
    let propertiesWritten = 0;

    for (const key in object) {
      if (Object.hasOwn(object, key)) {
        if (typeof key !== "string") continue;

        const value = object[key];

        // If the property is no longer found, do not serialize it.
        // This could happen if a getter deleted the property.
        if (!(key in object)) continue;

        if (!this.writeObject(key) || !this.writeObject(value)) {
          throw Error('TODO')
        }
        propertiesWritten++;
      }
    }

    return propertiesWritten;
  }

  private writeJSObjectPropertiesNonNumericKeys(object: any, keys: PropertyKey[]): number {
    let propertiesWritten = 0;

    for (const key of keys) {
      if (typeof key !== "string" || Number.isInteger(Number(key))) continue;

      const value = object[key];

      // If the property is no longer found, do not serialize it.
      // This could happen if a getter deleted the property.
      if (!(key in object)) continue;

      if (!this.writeString(key) || !this.writeObject(value)) {
        throw Error('TODO')
      }
      propertiesWritten++;
    }

    return propertiesWritten;
  }
  
  private isHostObject(jsObject: any): boolean|null {
    let result: boolean|null;
    try {
      if (!this.delegate || !this.hasCustomHostObjects) {
        return false;
      }
      result = this.delegate.isHostObject(jsObject);

    } catch {
      return null;
    }

    return result;
  }

  private throwDataCloneError(object: any): never {
    const message = `Could not clone ${object}`;
    if (this.delegate) {
      return this.delegate.throwDataCloneError(message);
    } else {
      throw new DOMException(message, "DataCloneError");
    }
  }
}

// Since null is taken to mean failure in the code below, need to replace this symbol with actual null before external usage. 
// This isn't ideal, as one must remember to replace it everywhere, but it works and unlikely to change anyway.
// Could be replace by a "Result" type, or throwing exceptions.
const sNull = Symbol('null');

const JSArrayBufferViewFlags = {
  LengthTracking: 1 << 0,
  BackedByRab: 1 << 1,
};

export interface ValueDeserializerDelegate {
  /**
   * The embedder overrides this method to read some kind of host object, if
   * possible. If not, a suitable exception should be thrown and
   * Maybe<Object>() returned.
   */
  readHostObject(): object|null;

  // /**
  //  * Get a WasmModuleObject given a transfer_id previously provided
  //  * by ValueSerializer::Delegate::GetWasmModuleTransferId
  //  */
  // getWasmModuleFromId(transferId: number): Maybe<WasmModuleObject>;

  /**
   * Get a SharedArrayBuffer given a clone_id previously provided
   * by ValueSerializer::Delegate::GetSharedArrayBufferId
   */
  getSharedArrayBufferFromId(cloneId: number): SharedArrayBuffer|null;

  // /**
  //  * Get the SharedValueConveyor previously provided by
  //  * ValueSerializer::Delegate::AdoptSharedValueConveyor.
  //  */
  // getSharedValueConveyor(): SharedValueConveyor | null;
}

export class ValueDeserializer {
  private position: number;
  private end: number;
  // private idMap: object[];
  private idMap: Map<number, object>;
  private cachedView: DataView | undefined;
  private forceUtf16 = false;
  // private GlobalBuffer;

  constructor(
    private data: Uint8Array,
    private delegate?: ValueDeserializerDelegate,
  ) {
    this.position = data.byteOffset;
    this.end = data.byteOffset + data.byteLength;
    this.idMap = new Map();
    // this.GlobalBuffer = 'Buffer' in globalThis ? (globalThis as any).Buffer : undefined;
  }

  private get view() {
    return this.cachedView || (this.cachedView = new DataView(this.data.buffer));
  }

  get wireFormatVersion(): number {
    if (!this.version) throw new Error('Wire format version not set');
    return this.version;
  }

  setForceUtf16(forceUtf16: boolean) {
    this.forceUtf16 = forceUtf16;
  }

  throwDataCloneError(message = ''): never {
    throw new DOMException(message, "DataCloneError");
  }

  readHeader(): boolean {
    if (this.peekTag() === SerializationTag.kVersion) {
      this.readTag();
      const version = this.readVarInt();
      if (version === null || version > kLatestVersion) {
        this.throwDataCloneError('Data clone deserialization version error');
      }
      this.version = version;
    }
    return true;
  }

  private peekTag(): SerializationTag | null {
    let peekPosition = this.position;
    let tag: SerializationTag;
    do {
      if (peekPosition >= this.end) return null;
      tag = this.data[peekPosition] as SerializationTag;
      peekPosition++;
    } while (tag === SerializationTag.kPadding);
    return tag;
  }

  private consumeTag(peekedTag: SerializationTag): void {
    const actualTag = this.readTag();
    if (actualTag !== peekedTag) {
      this.throwDataCloneError('Tag mismatch');
    }
  }

  private readTag(): SerializationTag {
    let tag: SerializationTag;
    do {
      if (this.position >= this.end) throw new Error('Unexpected end of data');
      tag = this.data[this.position] as SerializationTag;
      this.position++;
    } while (tag === SerializationTag.kPadding);
    return tag;
  }

  private readVarInt(): number | null {
    let value = 0;
    let shift = 0;
    let hasAnotherByte: boolean;
    do {
      if (this.position >= this.end) return null;
      const byte = this.data[this.position];
      hasAnotherByte = !!(byte & 0x80);
      value |= (byte & 0x7F) << shift;
      shift += 7;
      this.position++;
    } while (hasAnotherByte);
    return value;
  }

  private readVarInt64(): bigint | null {
    let value = 0n;
    let shift = 0n;
    let hasAnotherByte: boolean;
    do {
      if (this.position >= this.end) return null;
      const byte = this.data[this.position];
      hasAnotherByte = !!(byte & 0x80);
      value |= BigInt(byte & 0x7F) << shift;
      shift += 7n;
      this.position++;
    } while (hasAnotherByte);
    return value;
  }

  private readZigZag(): number | null {
    const unsignedValue = this.readVarInt();
    if (unsignedValue === null) return null;
    return (unsignedValue >>> 1) ^ -(unsignedValue & 1);
  }

  readDouble(): number | null {
    if (this.end - this.position < 8) return null;
    const value = this.view.getFloat64(this.data.byteOffset + this.position, true)
    this.position += 8;
    return value;
  }

  readRawBytes(size: number): Uint8Array | null {
    if (this.end - this.position < size) return null;
    const bytes = this.data.subarray(this.position, this.position + size);
    this.position += size;
    return bytes;
  }

  readRawBytesNoAlloc(size: number): number | null {
    if (this.end - this.position < size) return null;
    const offset = this.position;
    this.position += size;
    return offset;
  }

  private readRawBytesAsUint16(size: number): Uint16Array | null {
    if (this.end - this.position < size) return null;
    const bytes = new Uint16Array(this.data.buffer, this.data.byteOffset + this.position, size / 2);
    this.position += size;
    return bytes;
  }

  readByte(): number {
    return this.data[this.position++];
  }
  
  readUint32(): number | null {
    return this.readVarInt();
  }

  readUint64(): bigint | null {
    return this.readVarInt64();
  }

  transferArrayBuffer(transferId: number, arrayBuffer: ArrayBuffer): void {
    this.arrayBufferTransferMap.set(transferId, arrayBuffer);
  }

  private suppressDeserializationErrors = false;
  private version?: number
  private version13BrokenDataMode!: boolean

  readObjectWrapper(): any {
    // We had a bug which produced invalid version 13 data (see
    // crbug.com/1284506). This compatibility mode tries to first read the data
    // normally, and if it fails, and the version is 13, tries to read the broken
    // format.
    const originalPosition = this.position;
    this.suppressDeserializationErrors = true;
    let result = this.readObject();

    if (result === null && this.version === 13) {
      this.version13BrokenDataMode = true;
      this.position = originalPosition;
      result = this.readObject();
    }

    if (result === null) {
      this.throwDataCloneError('Could not deserialize data');
    }

    return result === sNull ? null : result;
  }

  private readObject(): any {
    let result = this.readObjectInternal();

    // ArrayBufferView is special in that it consumes the value before it, even
    // after format version 0.
    if (result !== null && result instanceof ArrayBuffer && this.peekTag() === SerializationTag.kArrayBufferView) {
      this.consumeTag(SerializationTag.kArrayBufferView);
      result = this.readJSArrayBufferView(result);
    }

    if (result === null && !this.suppressDeserializationErrors) {
      this.throwDataCloneError();
    }

    return result;
  }

  private readObjectInternal(): any {
    const tag = this.readTag();
    switch (tag) {
      case SerializationTag.kVerifyObjectCount:
        if (this.readVarInt() === null) return null;
        return this.readObject();
      case SerializationTag.kUndefined:
        return undefined;
      case SerializationTag.kNull:
        return sNull;
      case SerializationTag.kTrue:
        return true;
      case SerializationTag.kFalse:
        return false;
      case SerializationTag.kInt32:
        const int32 = this.readZigZag();
        return int32 !== null ? int32 : null;
      case SerializationTag.kUint32:
        const uint32 = this.readVarInt();
        return uint32 !== null ? uint32 : null;
      case SerializationTag.kDouble:
        const double = this.readDouble();
        return double !== null ? double : null;
      case SerializationTag.kBigInt:
        return this.readBigInt();
      case SerializationTag.kUtf8String:
        return this.readUtf8String();
      case SerializationTag.kOneByteString:
        return this.readOneByteString();
      case SerializationTag.kTwoByteString:
        return this.readTwoByteString();
      case SerializationTag.kObjectReference:
        const id = this.readVarInt();
        return id !== null ? this.getObjectWithID(id) : null;
      case SerializationTag.kBeginJSObject:
        return this.readJSObject();
      case SerializationTag.kBeginSparseJSArray:
        return this.readSparseJSArray();
      case SerializationTag.kBeginDenseJSArray:
        return this.readDenseJSArray();
      case SerializationTag.kDate:
        return this.readJSDate();
      case SerializationTag.kTrueObject:
      case SerializationTag.kFalseObject:
      case SerializationTag.kNumberObject:
      case SerializationTag.kBigIntObject:
      case SerializationTag.kStringObject:
        return this.readJSPrimitiveWrapper(tag);
      case SerializationTag.kRegExp:
        return this.readJSRegExp();
      case SerializationTag.kBeginJSMap:
        return this.readJSMap();
      case SerializationTag.kBeginJSSet:
        return this.readJSSet();
      case SerializationTag.kArrayBuffer:
        return this.readJSArrayBuffer(false, false);
      case SerializationTag.kResizableArrayBuffer:
        return this.readJSArrayBuffer(false, true);
      case SerializationTag.kArrayBufferTransfer:
        return this.readTransferredJSArrayBuffer();
      case SerializationTag.kSharedArrayBuffer:
        return this.readJSArrayBuffer(true, false);
      case SerializationTag.kError:
        return this.readJSError();
      case SerializationTag.kHostObject:
        return this.readHostObject();
      // case SerializationTag.kSharedObject:
      //   if (this.version >= 15) return this.readSharedObject();
      //   return null;
      default:
        if (this.wireFormatVersion < 13) {
          this.position--;
          return this.readHostObject();
        }
        return null;
    }
  }

  private readString(): string | null {
    if (this.wireFormatVersion < 12) return this.readUtf8String();
    
    const object = this.readObject();
    if (object === null || typeof object !== "string") {
      return null;
    }
    
    return object;
  }

  private readBigInt(): bigint | null {
    const bitfield = this.readVarInt();
    if (bitfield === null) return null;

    const byteLength = bitfield >>> 1;
    const digitsStorage = this.readRawBytes(byteLength);
    if (digitsStorage === null) return null;

    return this.bigIntFromSerializedDigits(digitsStorage, bitfield);
  }

  // XXX: Should probably co-locate with the serializer (writeBigIntContents in ValueSerializer)
  private bigIntFromSerializedDigits(digitsStorage: Uint8Array, bitfield: number): bigint {
    let bigint = 0n;
    let factor = 1n;
    for (let i = 0; i < digitsStorage.length; i++) {
      bigint += BigInt(digitsStorage[i]) * factor;
      factor <<= 8n; // equivalent to multiplying by 256
    }
    if (bitfield & 1) {
      bigint = -bigint;
    }
    return bigint;
  }

  private _tdUtf8?: TextDecoder;
  private _tdUtf16?: TextDecoder;
  private _tdLatin1?: TextDecoder;
  private get tdUtf8() { return this._tdUtf8 ??= new TextDecoder('utf-8') }
  private get tdUtf16() { return this._tdUtf16 ??= new TextDecoder('utf-16le', { fatal: false }) }
  private get tdLatin1() { return this._tdLatin1 ??= new TextDecoder('latin1') }

  private readUtf8String(): string | null {
    const utf8Length = this.readVarInt();
    if (utf8Length === null) return null;

    const utf8Bytes = this.readRawBytes(utf8Length);
    if (utf8Bytes === null) return null;

    return this.tdUtf8.decode(utf8Bytes);
  }

  private readOneByteString(): string | null {
    const byteLength = this.readVarInt();
    if (byteLength === null) return null;

    const bytes = this.readRawBytes(byteLength);
    if (bytes === null) return null;

    // // Fast path for Node.js
    // if (this.GlobalBuffer) {
    //   return this.GlobalBuffer.from(bytes.buffer, bytes.byteOffset, bytes.length).toString('latin1');
    // }

    return this.tdLatin1.decode(bytes);
  }

  private readTwoByteString(): string | null {
    const byteLength = this.readVarInt();
    if (byteLength === null) return null;

    if (this.forceUtf16) {
      const bytes = this.readRawBytes(byteLength);
      if (bytes === null) return null;

      return this.tdUtf16.decode(bytes);
    }

    const bytes = this.readRawBytesAsUint16(byteLength);
    if (bytes === null) return null;

    return stringFromCharCode(bytes);
  }

  private readJSObject(): object | null {
    const id = this.nextId++;
    const object = {};

    this.addObjectWithID(id, object);

    let numProperties: number|null;
    let expectedNumProperties: number|null;

    if (
      (numProperties = this.readJSObjectProperties(object, SerializationTag.kEndJSObject)) === null ||
      (expectedNumProperties = this.readVarInt()) === null ||
      numProperties !== expectedNumProperties
    ) {
      return null;
    }

    if (!this.hasObjectWithID(id)) {
      throw new Error("Object with ID not found");
    }

    return object;
  }

  private readSparseJSArray(): any[] | null {
    const length = this.readVarInt();
    if (length === null) return null;

    const id = this.nextId++;
    const array: unknown[] = new Array(length);

    this.addObjectWithID(id, array);

    let numProperties: number|null;
    let expectedNumProperties: number|null;
    let expectedLength: number|null;

    if (
      (numProperties = this.readJSObjectProperties(array, SerializationTag.kEndSparseJSArray)) === null ||
      (expectedNumProperties = this.readVarInt()) === null ||
      (expectedLength = this.readVarInt()) === null ||
      numProperties !== expectedNumProperties || length !== expectedLength
    ) {
      return null;
    }

    if (!this.hasObjectWithID(id)) {
      throw new Error("Object with ID not found");
    }

    return array;
  }

  private readDenseJSArray(): any[] | null {
    // We shouldn't permit an array larger than the biggest we can request from
    // V8. As an additional sanity check, since each entry will take at least one
    // byte to encode, if there are fewer bytes than that we can also fail fast.
    const length = this.readVarInt();
    if (length === null || length > FixedArrayMaxLength || length > this.end - this.position) {
      return null;
    }

    const id = this.nextId++;
    const array: unknown[] = new Array(length);

    this.addObjectWithID(id, array);

    for (let i = 0; i < length; i++) {
      const tag = this.peekTag();
      if (tag === SerializationTag.kTheHole) {
        this.consumeTag(SerializationTag.kTheHole);
        continue;
      }

      const element = this.readObject();
      if (element === null) return null;

      // Serialization versions less than 11 encode the hole the same as
      // undefined. For consistency with previous behavior, store these as the
      // hole. Past version 11, undefined means undefined.
      if (this.wireFormatVersion < 11 && element === undefined) continue;

      array[i] = element === sNull ? null : element;
    }

    let numProperties: number|null;
    let expectedNumProperties: number|null;
    let expectedLength: number|null;

    if (
      (numProperties = this.readJSObjectProperties(array, SerializationTag.kEndDenseJSArray)) === null ||
      (expectedNumProperties = this.readVarInt()) === null ||
      (expectedLength = this.readVarInt()) === null ||
      numProperties !== expectedNumProperties || length !== expectedLength
    ) {
      return null;
    }

    if (!this.hasObjectWithID(id)) {
      throw new Error("Object with ID not found");
    }

    return array;
  }

  private readJSDate(): Date | null {
    const value = this.readDouble();
    if (value === null) return null;

    const id = this.nextId++;
    const date = new Date(value);

    this.addObjectWithID(id, date);
    return date;
  }

  private readJSPrimitiveWrapper(tag: SerializationTag): any | null {
    const id = this.nextId++;
    let value: any;

    switch (tag) {
      case SerializationTag.kTrueObject:
        value = new Boolean(true);
        break;
      case SerializationTag.kFalseObject:
        value = new Boolean(false);
        break;
      case SerializationTag.kNumberObject:
        const number = this.readDouble();
        if (number === null) return null;
        value = new Number(number);
        break;
      case SerializationTag.kBigIntObject:
        const bigint = this.readBigInt();
        if (bigint === null) return null;
        value = Object(bigint);
        break;
      case SerializationTag.kStringObject:
        const string = this.readString();
        if (string === null) return null;
        value = new String(string);
        break;
      default:
        throw new Error("Unreachable code");
    }

    this.addObjectWithID(id, value);
    return value;
  }

  private readJSRegExp(): RegExp | null {
    const id = this.nextId++;
    const pattern = this.readString();
    const rawFlags = this.readVarInt();

    if (pattern === null || rawFlags === null) {
      return null;
    }

    const flagStr = this.getFlagString(rawFlags);

    const regexp = new RegExp(pattern, flagStr);
    this.addObjectWithID(id, regexp);
    return regexp;
  }

  private getFlagString(flags: number): string {
    let flagStr = '';
    if (flags & (1 << 0)) flagStr += 'g';
    if (flags & (1 << 1)) flagStr += 'i';
    if (flags & (1 << 2)) flagStr += 'm';
    if (flags & (1 << 3)) flagStr += 'y';
    if (flags & (1 << 4)) flagStr += 'u';
    if (flags & (1 << 5)) flagStr += 's';
    return flagStr;
  }

  private readJSMap(): Map<any, any> | null {
    const id = this.nextId++;
    const map = new Map();
    this.addObjectWithID(id, map);

    let length = 0;
    while (true) {
      const tag = this.peekTag();
      if (tag === null) return null;
      if (tag === SerializationTag.kEndJSMap) {
        this.consumeTag(SerializationTag.kEndJSMap);
        break;
      }

      let key;
      let value;
      if ((key = this.readObject()) === null || (value = this.readObject()) === null) {
        return null;
      }

      map.set(key === sNull ? null : key, value === sNull ? null : value);
      length += 2;
    }

    const expectedLength = this.readVarInt();
    if (expectedLength === null || length !== expectedLength) {
      return null;
    }

    return map;
  }

  private readJSSet(): Set<any> | null {
    const id = this.nextId++;
    const set = new Set();
    this.addObjectWithID(id, set);

    let length = 0;
    while (true) {
      const tag = this.peekTag();
      if (tag === null) return null;
      if (tag === SerializationTag.kEndJSSet) {
        this.consumeTag(SerializationTag.kEndJSSet);
        break;
      }

      const value = this.readObject();
      if (value === null) {
        return null;
      }

      set.add(value === sNull ? null : value);
      length++;
    }

    const expectedLength = this.readVarInt();
    if (expectedLength === null || length !== expectedLength) {
      return null;
    }

    return set;
  }

  private readJSArrayBuffer(isShared: boolean, isResizable: boolean): ArrayBuffer | null {
    const id = this.nextId++;
    if (isShared) {
      const cloneId = this.readVarInt();
      if (cloneId === null || !this.delegate) return null;

      const arrayBuffer = this.delegate.getSharedArrayBufferFromId(cloneId);
      if (!arrayBuffer) return null;

      this.addObjectWithID(id, arrayBuffer);
      return arrayBuffer;
    }

    const byteLength = this.readVarInt();
    if (byteLength === null) return null;

    let maxByteLength = byteLength;
    if (isResizable) {
      const readMaxByteLength = this.readVarInt();
      if (readMaxByteLength === null || byteLength > readMaxByteLength) {
        return null;
      }
      maxByteLength = readMaxByteLength;
    }

    if (byteLength > (this.end - this.position)) {
      return null;
    }

    const arrayBuffer = isResizable
      // @ts-ignore: missing types
      ? new ArrayBuffer(byteLength, { maxByteLength }) 
      : new ArrayBuffer(byteLength);

    if (byteLength > 0) {
      const bytes = this.data.subarray(this.position, this.position + byteLength);
      new Uint8Array(arrayBuffer).set(bytes);
    }
    this.position += byteLength;
    this.addObjectWithID(id, arrayBuffer);
    return arrayBuffer;
  }

  private arrayBufferTransferMap = new Map<number, ArrayBuffer>();

  private readTransferredJSArrayBuffer(): ArrayBuffer | null {
    const id = this.nextId++;
    const transferId = this.readVarInt();
    if (transferId === null) return null;

    const arrayBuffer = this.arrayBufferTransferMap.get(transferId);
    if (!arrayBuffer) return null;

    this.addObjectWithID(id, arrayBuffer);
    return arrayBuffer;
  }

  private readJSArrayBufferView(buffer: ArrayBuffer): any | null {
    const bufferByteLength = buffer.byteLength
    let tag: number|null = 0;
    let byteOffset: number|null = 0;
    let byteLength: number|null = 0;
    let flags: number|null = 0;

    if ((tag = this.readVarInt()) === null ||
        (byteOffset = this.readVarInt()) === null ||
        (byteLength = this.readVarInt()) === null ||
        byteOffset > bufferByteLength ||
        byteLength > bufferByteLength - byteOffset) {
      return null;
    }

    const shouldReadFlags = this.wireFormatVersion >= 14 || this.version13BrokenDataMode;
    if (shouldReadFlags && (flags = this.readVarInt()) === null) {
      return null;
    }

    const id = this.nextId++;

    if (tag === ArrayBufferViewTag.kDataView) {
      // We can't really do anything about these in userland
      // const isLengthTracking = { value: false };
      // const isBackedByRab = { value: false }; 
      if (!this.validateJSArrayBufferViewFlags(buffer, flags, /* isLengthTracking, isBackedByRab */)) {
        return null;
      }
      const dataView = new DataView(buffer, byteOffset, byteLength, /* isLengthTracking.value */);
      this.addObjectWithID(id, dataView);
      return dataView;
    }

    const externalArrayCtor = this.getTypedArrayConstructorFor(tag);
    const elementSize = externalArrayCtor.BYTES_PER_ELEMENT;

    if (elementSize === 0 || byteOffset % elementSize !== 0 || byteLength % elementSize !== 0) {
      return null;
    }

    // We can't really do anything about these in userland
    // const isLengthTracking = { value: false };
    // const isBackedByRab = { value: false };
    if (!this.validateJSArrayBufferViewFlags(buffer, flags, /* isLengthTracking, isBackedByRab */)) {
      return null;
    }

    const typedArray = new externalArrayCtor(buffer, byteOffset, byteLength / elementSize, /* isLengthTracking.value */);
    this.addObjectWithID(id, typedArray);
    return typedArray;
  }
  
  // XXX: Should probably co-locate this with the inverse function
  private getTypedArrayConstructorFor(tag: ArrayBufferViewTag): TypedArrayConstructor {
    switch (tag) {
      case ArrayBufferViewTag.kUint8Array:
        return Uint8Array;
      case ArrayBufferViewTag.kInt8Array:
        return Int8Array;
      case ArrayBufferViewTag.kUint8ClampedArray:
        return Uint8ClampedArray;
      case ArrayBufferViewTag.kInt16Array:
        return Int16Array;
      case ArrayBufferViewTag.kUint16Array:
        return Uint16Array;
      case ArrayBufferViewTag.kInt32Array:
        return Int32Array;
      case ArrayBufferViewTag.kUint32Array:
        return Uint32Array;
      case ArrayBufferViewTag.kFloat16Array:
        if ('Float16Array' in globalThis) {
          return globalThis.Float16Array;
        } else {
          throw new Error('Float16Array is not supported in this environment.');
        }
      case ArrayBufferViewTag.kFloat32Array:
        return Float32Array;
      case ArrayBufferViewTag.kFloat64Array:
        return Float64Array;
      case ArrayBufferViewTag.kBigInt64Array:
        return BigInt64Array;
      case ArrayBufferViewTag.kBigUint64Array:
        return BigUint64Array;
      default:
        throw new Error('Unknown ArrayBufferViewTag');
    }
  }

  private validateJSArrayBufferViewFlags(
    buffer: ArrayBuffer|SharedArrayBuffer,
    serializedFlags: number,
    // isLengthTracking: { value: boolean },
    // isBackedByRab: { value: boolean }
  ): boolean {
    const isLT = /* isLengthTracking.value = */(serializedFlags & JSArrayBufferViewFlags.LengthTracking) !== 0;
    const isBBRab = /* isBackedByRab.value = */(serializedFlags & JSArrayBufferViewFlags.BackedByRab) !== 0;

    if (isBBRab || isLT) {
      if (!isResizableArrayBuffer(buffer)) {
        return false;
      }
      if (isBBRab && buffer instanceof SharedArrayBuffer) {
        return false;
      }
    }
    // The RAB-ness of the buffer and the TA's "is_backed_by_rab" need to be in sync.
    if (isResizableArrayBuffer(buffer) && !(buffer instanceof SharedArrayBuffer) && !isBBRab) {
      return false;
    }
    return true;
  }

  private readJSError(): Error | null {
    const id = this.nextId++;
    const tag = this.readVarInt() as ErrorTag;
    const ErrorCtor = this.getErrorConstructorFor(tag);
    if (ErrorCtor === Error) this.position--; // HACK: This is not ideal, but it works

    let message: string | undefined;
    let stack: string | undefined;
    let cause: any | null = null;

    let nextTag;
    while ((nextTag = this.readVarInt()) !== ErrorTag.kEnd) {
      switch (nextTag) {
        case ErrorTag.kMessage:
          message = this.readString() ?? undefined;
          break;
        case ErrorTag.kStack:
          stack = this.readString() ?? undefined;
          break;
        case ErrorTag.kCause:
          cause = this.readObject();
          break;
        default:
          return null;
      }
    }

    const error = new ErrorCtor(message, { 
      cause: cause === sNull ? null : cause
    });

    if (stack) {
      Object.defineProperty(error, 'stack', {
        value: stack,
        enumerable: false,
      });
    }

    this.addObjectWithID(id, error);
    return error;
  }

  private getErrorConstructorFor(tag: ErrorTag): ErrorConstructor {
    switch (tag) {
      case ErrorTag.kEvalErrorPrototype:
        return EvalError;
      case ErrorTag.kRangeErrorPrototype:
        return RangeError;
      case ErrorTag.kReferenceErrorPrototype:
        return ReferenceError;
      case ErrorTag.kSyntaxErrorPrototype:
        return SyntaxError;
      case ErrorTag.kTypeErrorPrototype:
        return TypeError;
      case ErrorTag.kUriErrorPrototype:
        return URIError;
      default:
        return Error;
    }
  }

  private nextId = 0;
  private hasObjectWithID(id: number): boolean {
    return this.idMap.has(id);
  }
  private getObjectWithID(id: number): object|undefined {
    return this.idMap.get(id);
  }
  private addObjectWithID(id: number, object: object) {
    this.idMap.set(id, object);
  }

  private readHostObject(): any | null {
    if (!this.delegate) return null;

    const id = this.nextId++;
    const object = this.delegate.readHostObject();

    if (!object) {
      return null;
    }

    this.addObjectWithID(id, object);
    return object;
  }

  private isValidObjectKey(key: unknown): boolean {
    return typeof key === "string" || typeof key === "number";
  }

  private readJSObjectProperties(object: any, endTag: number): number | null {
    let numProperties = 0;

    while (true) {
      const tag = this.peekTag();
      if (tag === null) return null;
      if (tag === endTag) {
        this.consumeTag(endTag);
        return numProperties;
      }

      const key = this.readObject();
      if (!this.isValidObjectKey(key)) {
        return null;
      }
      const value = this.readObject();
      if (value === null) return null;

      const lookupKey = key === sNull ? null : key;
      if (Object.hasOwn(object, lookupKey)) {
        return null;
      }

      object[lookupKey] = value === sNull ? null : value;

      numProperties++;
    }
  }
}
