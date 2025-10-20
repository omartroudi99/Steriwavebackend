import { Controller, Post, Body } from '@nestjs/common';
import { AuthDeviceService } from './authdevice.service';
import { LoginDto } from './dto/login.dto';

@Controller('authdevice')
export class AuthDeviceController {
  constructor(private readonly authService: AuthDeviceService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
}
