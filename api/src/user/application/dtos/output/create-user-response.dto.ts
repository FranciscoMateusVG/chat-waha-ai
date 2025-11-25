interface UserData {
	id: string,
	name: string,
	phone: string,
	email: string,
}

export interface CreateUserResponseSuccess {
	success: true,
	user: UserData
}

export interface CreateUserResponseError {
	success: false,
	error: string,
}

export type CreateUserResponseDto = CreateUserResponseSuccess | CreateUserResponseError;
