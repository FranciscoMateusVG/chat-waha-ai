import { Logger } from "@nestjs/common";
import { UserRepository } from "../../domain/repositories/user.repository";
import { CreateUserDto } from "../dtos/input/create-user.dto";
import { CreateUserResponseDto } from "../dtos/output/create-user-response.dto";
import { User } from "src/user/domain/entities/user";

export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    try {
      const user = User.create(dto.name, dto.email, dto.phone);

      this.logger.log(
        `Creating user with email ${dto.email} and phone ${dto.phone}`,
      );
      const result = await this.userRepository.save(user);

      return {
        success: true,
        user: {
          id: result.id.toString(),
          name: result.name,
          phone: result.phone.toString(),
          email: result.email.toString(),
        },
      };
    } catch (error) {
      this.logger.log(
        `Creating user with email ${dto.email} and phone ${dto.phone} failed with error: ${error.message}`,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }
}
