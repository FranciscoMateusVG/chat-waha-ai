const MIN_LENGTH = 10; // DDD + 8 digits number (without starting 9)
const MAX_LENGTH = 13; // DDI + DDD + 9 digits number (with starting 9)

export class PhoneNumber {
  private readonly _value: string;

  constructor(raw: string) {
    const cleaned = this.clean(raw);
    const normalized = this.normalize(cleaned);

    if (!this.isValid(normalized)) {
      throw new Error(`Invalid this.format: ${raw}`);
    }

    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    const ddi = this._value.slice(0, 2);
    const ddd = this._value.slice(2, 4);

    const number = this._value.slice(4);
    const left = number.slice(0, 5);
    const right = number.slice(5);

    return `+${ddi} (${ddd}) ${left}-${right}`;
  }

  private clean(value: string): string {
    return value.replace(/\D/g, "");
  }

  private normalize(value: string): string {
    let v = this.addsCountryCodeIfNeeded(value);
    v = this.addsNineDigitIfNeeded(v);
    return v;
  }

  private addsCountryCodeIfNeeded(value: string) {
    return value.startsWith("55") ? value : `55${value}`;
  }

  private addsNineDigitIfNeeded(value: string) {
    if (value.length === 12) {
      const prefix = value.slice(0, 4);
      const suffix = value.slice(4);
      return `${prefix}9${suffix}`;
    }
    return value;
  }

  private isValid(value: string): boolean {
    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
      return false;
    }

    const regex = /^55\d{10,11}$/;
    return regex.test(value);
  }
}
