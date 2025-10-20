import { Body, Controller, Param, Put } from '@nestjs/common';
import { CommandConfirmationService } from './command-confirmation.service';

@Controller('command-confirmation')
export class CommandConfirmationController {
  constructor(
    private readonly commandConfirmationService: CommandConfirmationService,
  ) {}

  @Put(':deviceId')
  async updateConfirmation(
    @Param('deviceId') deviceId: string,
    @Body() body: any,
  ) {
    console.log('📥 Données reçues :', body);

    const { command, status } = body;

    if (!command || status === undefined) {
      throw new Error('Le champ command ou status est manquant.');
    }

    return this.commandConfirmationService.updateConfirmation(
      deviceId,
      command,
      status,
    );
  }
}
