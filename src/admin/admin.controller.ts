import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from '../steriwave/dto/create-admin.dto';
import { UpdateAdminDto } from '../steriwave/dto/update-admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('visors')
  getVisors() {
    return this.adminService.getVisors();
  }

  @Post('create')
  create(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  @Put('update/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.updateAdmin(id, dto);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.adminService.deleteAdmin(id);
  }
  
}
