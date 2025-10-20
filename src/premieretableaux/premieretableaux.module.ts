import { Module } from '@nestjs/common';
import { PremieretableauxService } from './premieretableaux.service';
import { PremieretableauxController } from './premieretableaux.controller';

@Module({
  controllers: [PremieretableauxController],
  providers: [PremieretableauxService],
})
export class PremieretableauxModule {}
