export interface ContactInfo {
  readonly value: string
  validate(): void
  format(): string
  equals(other: ContactInfo): boolean
}
