import { Controller, Get } from '@nestjs/common';

@Controller('prefacturas')
export class PrefacturasController {
  @Get()
  findAll() {
    return [];
  }
}
