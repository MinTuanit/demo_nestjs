import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePassWord, hashPassword } from '@/utils/hashPassword';
import { ChangePasswordDto, CodeAuthDto, CreateAuthDto } from './dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '@nestjs-modules/mailer';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService
  ) { this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findUserByEmail(username);
    if (!user) return null;

    if (user.accountType === "GOOGLE") {
      return null;
    }

    const isValidUser = await comparePassWord(pass, user.password);
    if (!isValidUser) return null;

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

  async googleLogin(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestException('Invalid Google token');
      }

      const { email, name, picture, sub } = payload;

      if (!email) {
        throw new BadRequestException('Google account has no email');
      }

      // Tìm user hoặc tạo mới bằng Google
      const user = await this.usersService.registerWithGoogle({
        email,
        name,
        googleId: sub,
        image: picture,
      });

      const jwtPayload = { username: user.email, sub: user._id };
      return {
        user: {
          _id: user._id,
          email: user.email,
          username: user.name,
          role: user.role,
        },
        access_token: this.jwtService.sign(jwtPayload),
      };
    } catch (err) {
      console.error('Google login error:', err);
      throw new BadRequestException('Google login failed');
    }
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

  retryPassword = async (email: string) => {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: new Date(Date.now() + 60 * 60 * 1000), // 1 hours
    })

    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Change Password', // Subject line
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

  changePassword = async (changePasswordDto: ChangePasswordDto) => {
    const { code, password, confirmPassword, email } = changePasswordDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Password vs confirm password incorrect');
    }

    const user = await this.usersService.findByEmailAndCode(email, code);

    if (!user) {
      throw new BadRequestException('User not found or Code is not correct');
    } else if (user.codeExpired < new Date()) { // Check if the code has expired
      throw new BadRequestException('Activation code has expired');
    }

    const hashedPassword = await hashPassword(password);
    await user.updateOne({
      password: hashedPassword
    })

    return {
      _id: user._id,
      email: user.email,
    }
  }
}