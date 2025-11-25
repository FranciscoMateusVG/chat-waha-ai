import { ContactInfo } from '../entities/contact-info'

export class EmailContactInfo implements ContactInfo {
  constructor(public readonly value: string) {}

  validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(this.value)) {
      throw new Error('Invalid email format')
    }
  }

  format(): string {
    return this.value.toLowerCase().trim()
  }

  equals(other: ContactInfo): boolean {
    return this.format() === other.format()
  }
}
