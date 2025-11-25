import { ContactInfo } from '../entities/contact-info'

export class WhatsappContactInfo implements ContactInfo {
  constructor(public readonly value: string) {}

  validate(): void {
    // TODO: remove this once we have a proper validation
    // if (!this.value.startsWith('+')) {
    //   throw new Error('Whatsapp contact info must start with +')
    // }
  }

  isChatId(): boolean {
    if (this.value.includes('@')) {
      return true
    }
    return false
  }

  format(): string {
    return this.value
  }

  equals(other: ContactInfo): boolean {
    return this.value === other.value
  }
}
