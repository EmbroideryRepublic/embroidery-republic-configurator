/** Kleiner Byte-Schreiber mit nachträglichem Überschreiben (für Längen- und Offsetfelder). Little Endian. */
export class ByteSchreiber {
  private bytes: number[] = [];

  get laenge(): number {
    return this.bytes.length;
  }

  u8(wert: number): this {
    this.bytes.push(wert & 0xff);
    return this;
  }

  u16(wert: number): this {
    this.bytes.push(wert & 0xff, (wert >> 8) & 0xff);
    return this;
  }

  u24(wert: number): this {
    this.bytes.push(wert & 0xff, (wert >> 8) & 0xff, (wert >> 16) & 0xff);
    return this;
  }

  u32(wert: number): this {
    this.bytes.push(wert & 0xff, (wert >> 8) & 0xff, (wert >> 16) & 0xff, (wert >>> 24) & 0xff);
    return this;
  }

  f32(wert: number): this {
    const puffer = Buffer.alloc(4);
    puffer.writeFloatLE(wert, 0);
    for (const b of puffer) this.bytes.push(b);
    return this;
  }

  /** Text als ASCII; Zeichen außerhalb von 0x20–0x7E werden zu "_", nur der Zeilenabschluss CR (0x0D) der Formatköpfe bleibt. */
  text(wert: string): this {
    for (const zeichen of wert) {
      const code = zeichen.charCodeAt(0);
      this.bytes.push((code >= 0x20 && code <= 0x7e) || code === 0x0d ? code : 0x5f);
    }
    return this;
  }

  fuell(wert: number, anzahl: number): this {
    for (let i = 0; i < anzahl; i++) this.bytes.push(wert & 0xff);
    return this;
  }

  roh(werte: ArrayLike<number>): this {
    for (let i = 0; i < werte.length; i++) this.bytes.push(werte[i]! & 0xff);
    return this;
  }

  /** Überschreibt ein 16-Bit-Feld an einer früheren Stelle. */
  setzeU16(position: number, wert: number): void {
    this.bytes[position] = wert & 0xff;
    this.bytes[position + 1] = (wert >> 8) & 0xff;
  }

  setzeU24(position: number, wert: number): void {
    this.bytes[position] = wert & 0xff;
    this.bytes[position + 1] = (wert >> 8) & 0xff;
    this.bytes[position + 2] = (wert >> 16) & 0xff;
  }

  setzeU32(position: number, wert: number): void {
    this.bytes[position] = wert & 0xff;
    this.bytes[position + 1] = (wert >> 8) & 0xff;
    this.bytes[position + 2] = (wert >> 16) & 0xff;
    this.bytes[position + 3] = (wert >>> 24) & 0xff;
  }

  zuBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }
}
