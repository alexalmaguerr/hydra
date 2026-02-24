import { Controller, Get } from '@nestjs/common';

@Controller('recibos')
export class RecibosController {
  @Get()
  findAll() {
    return [];
  }
}
