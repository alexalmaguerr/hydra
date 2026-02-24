import { Controller, Get } from '@nestjs/common';

@Controller('timbrados')
export class TimbradosController {
  @Get()
  findAll() {
    return [];
  }
}
