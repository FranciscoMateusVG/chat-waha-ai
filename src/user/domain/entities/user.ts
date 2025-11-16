import { UserId } from "../value-objects/uuid.vo";
import { PhoneNumber } from "../value-objects/phone-number.vo";

export class User {
  private _id: UserId;
  private _name: string;
  private _phone: PhoneNumber;

  constructor(props: { id: UserId; name: string; phone: PhoneNumber }) {
    this._id = props.id;
    this._phone = props.phone;
    this._name = props.name;
  }

  static create(name: string, phone: PhoneNumber, id?: UserId) {
    return new User({
      id: id ?? new UserId(),
      name: name,
      phone: phone,
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
