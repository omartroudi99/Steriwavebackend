import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { PremieretableauxService } from './premieretableaux.service';

@Controller('premieretableaux')
export class PremieretableauxController {
  constructor(private readonly service: PremieretableauxService) {}

  @Get('sterilisateurs')
  async getSterilisateurs(
    @Query('role') role: string,
    @Query('email') email: string,
  ) {
    return this.service.getSterilisateurs(role, email);
  }

  @Post('assign')
  async assignSterilisateurs(@Body() body: any) {
    return this.service.assignSterilizersToUser(body);
  }

  @Post('unassign')
  async unassignSterilizer(
    @Body() body: { deviceId: string; email: string; role: string }
  ) {
    const { deviceId, email, role } = body;
    return this.service.unassignSterilizerFromUser(deviceId, email, role);
  }
  

  // ✅ Ajout de la modification
  @Post('updateSterilizer')
  async updateSterilizer(@Body() body: any) {
    return this.service.updateSterilizerDetails(body);
  }
}
