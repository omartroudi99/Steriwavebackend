import { Body, Controller, Post } from '@nestjs/common';
import { HistoriqueService } from '././historique.service';

@Controller('historique')
export class HistoriqueController {
  constructor(private readonly historiqueService: HistoriqueService) {}

  @Post('add')
  async addHistorique(@Body() body: any) {
    const { deviceId, ...data } = body;

    if (!deviceId) {
      return { success: false, message: 'deviceId est requis' };
    }

    await this.historiqueService.addHistorique(deviceId, data);
    return { success: true, message: 'Historique ajouté avec succès' };
  }
}
