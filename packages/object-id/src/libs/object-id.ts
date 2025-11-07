import { randomBytes } from 'crypto';

let counter = randomBytes(4).readUInt32BE(0) & 0xffffffff;

const MACHINE_ID = randomBytes(5);

export class ObjectId {
  private _buffer: Buffer;

  public constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  public static generate(type?: number) {
    const buffer = Buffer.alloc(13);

    const time = Math.floor(Date.now() / 1000) & 0xffffffff;

    counter = (counter + 1) & 0xffffff;

    buffer[0] = (type ?? 0) & 0xff;
    buffer[1] = (time >> 24) & 0xff;
    buffer[2] = (time >> 16) & 0xff;
    buffer[3] = (time >> 8) & 0xff;
    buffer[4] = time & 0xff;
    buffer[5] = MACHINE_ID[0];
    buffer[6] = MACHINE_ID[1];
    buffer[7] = MACHINE_ID[2];
    buffer[8] = MACHINE_ID[3];
    buffer[9] = MACHINE_ID[4];
    buffer[10] = (counter >> 16) & 0xff;
    buffer[11] = (counter >> 8) & 0xff;
    buffer[12] = counter & 0xff;

    return new ObjectId(buffer);
  }

  public get buffer() {
    return this._buffer;
  }

  public static from(value: string | Buffer) {
    if (typeof value === 'string') {
      if (value.length > 20) {
        throw new Error('String value exceeds the limit of 20 characters');
      }

      return new ObjectId(Buffer.from(ObjectId._fromUrlSafe(value)));
    }

    if (value instanceof Buffer) {
      return new ObjectId(value);
    }

    throw new Error('Invalid value type. Expected string or Buffer.');
  }

  static _toUrlSafe(buffer: Buffer): string {
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static _fromUrlSafe(str: string): Buffer {
    const base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');

    return Buffer.from(base64, 'base64');
  }

  public toString(encoding?: 'hex' | 'base64') {
    if (!encoding || encoding === 'base64') {
      return ObjectId._toUrlSafe(this._buffer);
    }

    return this._buffer.toString(encoding);
  }
}
