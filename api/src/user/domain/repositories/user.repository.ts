import { UserId } from "src/notifications";
import { User } from "../entities/user";
import { Email } from "../value-objects/email.vo";

export interface WhereParam {
  key: string;
  operator: "=" | ">" | "<" | "like";
  value: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserRepository {
  findAll(): Promise<User>;
  findAllPaginated(params: PaginationParams): Promise<PaginatedResult<User>>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findWhere(params: WhereParam[]): Promise<User[]>;
  search(query: string): Promise<User>;
  save(entity: User): Promise<User>;
}
