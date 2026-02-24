import { Controller, Get } from '@nestjs/common';

@Controller('lecturas')
export class LecturasController {
  @Get()
  findAll() {
    return [];
  }
}
