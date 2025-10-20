import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  async createRoom(
    @Query('email') email: string,
    @Body('name') name: string,
  ) {
    return this.roomsService.createRoom(email, name);
  }

  @Get()
  async getRooms(@Query('email') email: string) {
    return this.roomsService.getRooms(email);
  }

  @Put('update/:roomId')
  async updateRoom(
    @Query('email') email: string,
    @Param('roomId') roomId: string,
    @Body('name') newName: string,
  ) {
    return this.roomsService.updateRoom(email, roomId, newName);
  }

  @Delete('delete/:roomId')
  async deleteRoom(
    @Query('email') email: string,
    @Param('roomId') roomId: string,
  ) {
    return this.roomsService.deleteRoom(email, roomId);
  }
}
