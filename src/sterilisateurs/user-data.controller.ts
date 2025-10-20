import { Controller, Get, Query } from '@nestjs/common';
import { UserDataService } from './user-data.service';

@Controller('user-data')
export class UserDataController {
  constructor(private readonly userDataService: UserDataService) {}

  @Get('by-email')
  async getByEmail(@Query('email') email: string) {
    return this.userDataService.getUserCollectionsByEmail(email);
  }
}
