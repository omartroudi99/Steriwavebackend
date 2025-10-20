import { Controller, Post, Body } from '@nestjs/common';
import { PriceService } from './price.service';
import { PriceRequestDto } from '../steriwave/dto/price.dto';

@Controller('price')
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @Post('total')
  async getTotal(@Body() dto: PriceRequestDto) {
    const result = await this.priceService.getTotalPrice(dto);
    return result; // { totalPrice, totalCount, totalWorking }
  }
  
}
