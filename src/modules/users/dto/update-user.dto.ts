import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    email?: never; // Override email → không validate và không cần gán

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    accountType?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    codeId?: string;

    @IsOptional()
    @IsDate()
    codeExpired?: Date;
}
