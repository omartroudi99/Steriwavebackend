import { Body, Controller, Get, Post, Param, Delete, Put } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto) {
    return this.authService.validateUser(dto);
  }

  @Post()
  async createAdmin(@Body() dto) {
    return this.authService.createAdmin(dto);
  }

  @Get()
  async getAll() {
    return this.authService.getAllAdmins();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.authService.getAdminById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto) {
    return this.authService.updateAdmin(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.authService.deleteAdmin(id);
  }
}
