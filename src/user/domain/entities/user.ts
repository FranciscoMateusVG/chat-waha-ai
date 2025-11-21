import { UserId } from "../value-objects/uuid.vo";
import { PhoneNumber } from "../value-objects/phone-number.vo";
import { Email } from "../value-objects/email.vo";

export class User {
  private _id: UserId;
  private _name: string;
  private _phone: PhoneNumber;
  private _email: Email;

  constructor(props: {
    id: UserId;
    name: string;
    phone: PhoneNumber;
    email: Email;
  }) {
    this._id = props.id;
    this._phone = props.phone;
    this._name = props.name;
    this._email = props.email;
  }

  static create(name: string, phone: PhoneNumber, email: Email, id?: UserId) {
    return new User({
      id: id ?? new UserId(),
      name: name,
      phone: phone,
      email: email,
    });
  }

  equals(other: User) {
    return this.id === other.id;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get phone() {
    return this._phone;
  }
}
