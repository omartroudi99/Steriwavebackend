import { Module } from '@nestjs/common';
import { CommandConfirmationController } from './command-confirmation.controller';
import { CommandConfirmationService } from './command-confirmation.service';

@Module({
  controllers: [CommandConfirmationController],
  providers: [CommandConfirmationService],
})
export class CommandConfirmationModule {}
