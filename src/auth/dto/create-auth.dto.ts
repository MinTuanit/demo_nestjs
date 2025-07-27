import { IsNotEmpty } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    name: string;
}

export class CodeAuthDto {
    @IsNotEmpty()
    _id: string;

    @IsNotEmpty()
    code: string;
}
