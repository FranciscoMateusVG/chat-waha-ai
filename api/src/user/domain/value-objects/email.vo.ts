export class Email {
  private readonly _value: string;

  constructor(raw: string) {
    const value = this.normalize(raw);

    if (!this.isValid(value)) {
      throw new Error(`Invalid ${this.constructor.name} format: ${value}`);
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email) {
    return this.value === other.value;
  }

  toString() {
    return this.value;
  }

  private normalize(value: string) {
    return value.trim().toLowerCase();
  }

  private isValid(value: string): boolean {
    if (!this.hasCorrectAmountOfAt(value)) return false;

    const [username, domain] = value.split("@");

    return this.validateEmailPart(username) && this.validateEmailDomain(domain);
  }

  private hasCorrectAmountOfAt(value: string): boolean {
    const atRegex = /@/gi;
    const matches = value.match(atRegex);

    if (matches === null || matches.length > 1) {
      return false;
    }

    return true;
  }

  private validateEmailPart(part: string): boolean {
    const validCharsRegex = /[\da-zA-z\._%+-]*/gi;

    if (!validCharsRegex.test(part)) return false;
    if (part.at(0) === ".") return false;
    if (/\.\./gi.test(part)) return false;
    if (part.length > 256) return false;

    return true;
  }

  private validateEmailDomain(domain: string): boolean {
    if (!this.validateEmailPart(domain)) return false;

    if (!/\./gi.test(domain)) return false;

    const parts = domain.split(".");
    return parts.every((part: string) => part.length > 1);
  }
}
