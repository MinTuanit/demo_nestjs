import { Controller, Request, Body, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public } from '@/decorator/customize';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) { }

  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Get('mail')
  testMail() {
    this.mailerService
      .sendMail({
        to: '22521615@gm.uit.edu.vn', // list of receivers
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'Hello', // plaintext body
        template: 'register', // The name of the template file
        context: {
          name: 'Tuan',
          activationCode: '1233456789',
        }
      })
      .then(() => { })
      .catch(() => { });
    return { message: 'Email sent successfully' };
  }
}
