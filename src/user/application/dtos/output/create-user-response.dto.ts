interface UserData {
	id: string,
	name: string,
	phone: string,
	email: string,
}

export interface CreateUserResponseSuccess {
	sucess: true,
	user: UserData
}

export interface CreateUserResponseError {
	sucess: false,
	error: string,
}

export type CreateUserResponseDto = CreateUserResponseSuccess | CreateUserResponseError;
