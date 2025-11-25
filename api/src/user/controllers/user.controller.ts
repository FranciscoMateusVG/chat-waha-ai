import { Body } from "@nestjs/common";
import { CreateUserUseCase } from "../application/use-cases/create-user.use-case";
import { CreateUserRequest } from "./interfaces/requests/create-user.request";
import { CreateUserResponse } from "./interfaces/responses/create-user.response";
import { AuthPort } from "../application/ports/auth.port";

export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly authService: AuthPort,
  ) {}

  async createUser(
    @Body() body: CreateUserRequest,
  ): Promise<CreateUserResponse> {
    try {
      const result = await this.createUserUseCase.execute({
        name: body.name,
        phone: body.phone,
        email: body.email,
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      await this.authService.registerUser(
        result.user.id,
        result.user.email,
        body.password,
      );

      // TODO: deal with success;
    } catch (error) {
      // TODO: deal with error;
    }
  }
}
