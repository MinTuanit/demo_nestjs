import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsEmail()
	email: string;

	@IsNotEmpty()
	@MinLength(6)
	password: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsOptional()
	@IsString()
	address?: string;

	@IsOptional()
	@IsString()
	image?: string;
}
