import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';

@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  findAll() {
    return this.contratosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contratosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateContratoDto) {
    return this.contratosService.create(dto);
  }
}
