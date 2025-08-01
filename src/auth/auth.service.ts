import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassWord } from '@/utils/hashPassword';
import { CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService
  ) { }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(username);
    if (!user) return null;
    const isvalidUser = user && await comparePassWord(pass, user.password);
    if (!isvalidUser) return null;
    return user;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      user: {
        _id: user._id,
        email: user.email,
        username: user.name,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.usersService.register(registerDto);
  }

  checkCode = async (codeDto: CodeAuthDto) => {
    return await this.usersService.handleActive(codeDto);
  }

  retryActive = async (email: string) => {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }
    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Action account', // Subject line
      template: 'register', // The name of the template file
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      }
    })

    return {
      _id: user._id,
      email: user.email,
    }
  }
}