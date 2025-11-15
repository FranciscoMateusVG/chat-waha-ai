import { UserId } from "../value-objects/uuid.vo.ts"
import { PhoneNumber } from "../value-objects/phone-number.vo.ts";

export class User {
	private id: UserId;
	private name: string;
	private phone: PhoneNumber;

	constructor({
		private readonly id: UserId,
		private readonly name: string,
		private readonly phone: PhoneNumber 
	}) {
		this.id = id;
		this.name = name;
		this.phone = phone;
	}

	static create(
		name: string,
		phoneNumber: PhoneNumber,
		id?: UserId
	) {
		return new User({
			id: id ?? new UserId(),
			name: name,
			phoneNumber: phoneNumber
		})
	}


	get id() {
		return this.id;
	}

	get name() {
		return this.name;
	}

	get phone() {
		return this.phone;
	}
}

