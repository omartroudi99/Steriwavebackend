import { Controller, Get, Query } from '@nestjs/common';
import { HistoriqueService, HistoriqueEntry } from './historique.service';

@Controller('historique')
export class HistoriqueController {
  constructor(private readonly historiqueService: HistoriqueService) {}

  @Get('by-user')
  async getHistoriqueByUser(
    @Query('email') email: string,
  ): Promise<HistoriqueEntry[] | { error: string }> {
    if (!email) {
      return { error: 'Email manquant dans la requête' };
    }

    return this.historiqueService.getHistoriqueByUserEmail(email);
  }
}
