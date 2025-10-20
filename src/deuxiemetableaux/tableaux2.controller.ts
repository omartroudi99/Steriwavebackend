import { Controller, Post, Body, Get, Query, Delete } from '@nestjs/common';
import { Tableaux2Service } from './tableaux2.service';
import { CreateUserDto } from '../steriwave/dto/create-user.dto';
import { UpdateUserDto } from '../steriwave/dto/update-user.dto';

@Controller('tableaux2')
export class Tableaux2Controller {
  constructor(private readonly service: Tableaux2Service) {}

  @Post('create')
  createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }

  @Post('update')
  updateUser(@Body() dto: UpdateUserDto) {
    return this.service.updateUser(dto);
  }

  @Delete('delete')
  deleteUser(@Body() body: { userId: string; uidAuth: string }) {
    return this.service.deleteUser(body.userId, body.uidAuth);
  }

  @Get('summary')
  getSummary(@Query('email') email: string, @Query('role') role: string) {
    return this.service.getUsersSummary(email, role);
  }
  
}
