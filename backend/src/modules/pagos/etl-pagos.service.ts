import { Injectable } from '@nestjs/common';

export interface RegistroPagoNormalizado {
  contratoRaw: string | null;
  referencia: string | null;
  monto: number;
  fechaPagoReal: Date;
  formaPago: string | null;
  canal: string | null;
  oficina: string | null;
  datosRaw: object;
  error?: string;
}

@Injectable()
export class EtlPagosService {
  parseArchivo(recaudador: string, contenido: string): RegistroPagoNormalizado[] {
    switch (recaudador.toUpperCase()) {
      case 'OXXO':
        return this.parseOXXO(contenido);
      case 'BANORTE':
        return this.parseBanorte(contenido);
      case 'BBVA':
      case 'BBVABANCOMER':
        return this.parseBBVA(contenido);
      case 'BBVA_DOM1':
        return this.parseBBVADom(contenido);
      case 'SANTANDER':
        return this.parseSantander(contenido);
      case 'CITYBANAMEX':
      case 'BANAMEX':
        return this.parseCityBanamex(contenido);
      case 'HSBC':
        return this.parseHSBC(contenido);
      default:
        return this.parseGenericoCsv(contenido, recaudador);
    }
  }

  private parseOXXO(contenido: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.trim())
      .map((linea) => {
        const campos = linea.split(',');
        if (campos.length < 7) return { error: 'Formato inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        const contratoRaw = campos[4]?.trim().replace(/^0+/, '') || null;
        const monto = parseFloat(campos[6]?.trim());
        const fechaStr = campos[2]?.trim();
        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
          formaPago: 'OXXO',
          canal: 'OXXO',
          oficina: campos[1]?.trim() || null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseBanorte(contenido: string): RegistroPagoNormalizado[] {
    const lineas = contenido.split('\n').filter((l) => l.trim() && !l.startsWith('001'));
    return lineas.map((linea) => {
      const contratoRaw = linea.substring(6, 14).trim().replace(/^0+/, '') || null;
      const monto = parseFloat(linea.substring(39, 53).trim()) / 100;
      const fechaStr = linea.substring(78, 86)?.trim();
      if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
      return {
        contratoRaw,
        referencia: linea.substring(0, 6).trim() || null,
        monto,
        fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
        formaPago: 'TRANSFERENCIA',
        canal: 'BANORTE',
        oficina: null,
        datosRaw: { raw: linea },
      };
    });
  }

  private parseBBVA(contenido: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.trim())
      .map((linea) => {
        const contratoRaw = linea.substring(3, 22).trim().replace(/^0+/, '') || null;
        const montoMatch = linea.match(/0{5,}(\d+\.\d{2})/g);
        const monto = montoMatch ? parseFloat(montoMatch[montoMatch.length - 1].replace(/^0+/, '')) : 0;
        const fechaMatch = linea.match(/(\d{4}-\d{2}-\d{2})/);
        if (!monto || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: fechaMatch ? new Date(fechaMatch[1]) : new Date(),
          formaPago: 'TRANSFERENCIA',
          canal: 'BBVA',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseBBVADom(contenido: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.startsWith('02'))
      .map((linea) => {
        const contratoRaw = linea.substring(60, 80)?.trim().replace(/^0+/, '') || null;
        const monto = parseFloat(linea.substring(20, 34)?.trim()) / 100;
        const fechaStr = linea.substring(34, 42)?.trim();
        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
          formaPago: 'DOMICILIACION',
          canal: 'BBVA_DOMICILIACION',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseSantander(contenido: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.trim())
      .map((linea) => {
        const fechaDDMMAAAA = linea.substring(14, 22).trim();
        const monto = parseFloat(linea.substring(32, 47).trim().replace('+', '')) / 100;
        const contratoRaw = linea.substring(50, 66)?.trim().replace(/^0+/, '') || null;
        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        return {
          contratoRaw,
          referencia: linea.substring(0, 14).trim() || null,
          monto,
          fechaPagoReal: this.parseFechaDDMMAAAA(fechaDDMMAAAA),
          formaPago: 'TRANSFERENCIA',
          canal: 'SANTANDER',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseCityBanamex(contenido: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.startsWith('607'))
      .map((linea) => {
        const contratoRaw = linea.substring(6, 16)?.trim().replace(/^0+/, '') || null;
        const monto = parseFloat(linea.substring(26, 40)?.trim()) / 100;
        const fechaStr = linea.substring(40, 46)?.trim();
        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaDDMMYY(fechaStr),
          formaPago: 'TRANSFERENCIA',
          canal: 'BANAMEX',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseHSBC(contenido: string): RegistroPagoNormalizado[] {
    const lineas = contenido.split('\n').slice(1).filter((l) => l.trim());
    return lineas.map((linea) => {
      const partes = linea.trim().split(/\s+/);
      const monto = parseFloat(partes[2]);
      const contratoRaw = partes.slice(3).join(' ').trim().replace(/\D/g, '') || null;
      if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) } as RegistroPagoNormalizado;
      return {
        contratoRaw,
        referencia: partes[0] || null,
        monto,
        fechaPagoReal: this.parseFechaSlash(partes[1]),
        formaPago: 'TRANSFERENCIA',
        canal: 'HSBC',
        oficina: null,
        datosRaw: { raw: linea },
      };
    });
  }

  private parseGenericoCsv(contenido: string, recaudador: string): RegistroPagoNormalizado[] {
    return contenido
      .split('\n')
      .filter((l) => l.trim())
      .map((linea) => ({
        contratoRaw: null,
        referencia: null,
        monto: 0,
        fechaPagoReal: new Date(),
        formaPago: this.formaPagoDefecto(recaudador),
        canal: recaudador,
        oficina: null,
        datosRaw: { raw: linea },
        error: `Parser genérico para ${recaudador}: revisar layout`,
      }));
  }

  private parseFechaAAAAMMDD(s?: string): Date {
    if (!s || s.length < 8) return new Date();
    return new Date(`${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`);
  }

  private parseFechaDDMMAAAA(s?: string): Date {
    if (!s || s.length < 8) return new Date();
    return new Date(`${s.substring(4, 8)}-${s.substring(2, 4)}-${s.substring(0, 2)}`);
  }

  private parseFechaDDMMYY(s?: string): Date {
    if (!s || s.length < 6) return new Date();
    const yy = parseInt(s.substring(4, 6));
    const yyyy = yy < 50 ? `20${yy.toString().padStart(2, '0')}` : `19${yy.toString().padStart(2, '0')}`;
    return new Date(`${yyyy}-${s.substring(2, 4)}-${s.substring(0, 2)}`);
  }

  private parseFechaSlash(s?: string): Date {
    if (!s) return new Date();
    const [dd, mm, yyyy] = s.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  private errorRecord(linea: string): Partial<RegistroPagoNormalizado> {
    return {
      contratoRaw: null,
      referencia: null,
      monto: 0,
      fechaPagoReal: new Date(),
      formaPago: null,
      canal: null,
      oficina: null,
      datosRaw: { raw: linea },
    };
  }

  formaPagoDefecto(recaudador: string): string {
    const map: Record<string, string> = {
      OXXO: 'EFECTIVO_OXXO',
      BANORTE: 'TRANSFERENCIA',
      BBVA: 'TRANSFERENCIA',
      BBVABANCOMER: 'TRANSFERENCIA',
      BBVA_DOM1: 'DOMICILIACION',
      SANTANDER: 'TRANSFERENCIA',
      BANAMEX: 'TRANSFERENCIA',
      CITYBANAMEX: 'TRANSFERENCIA',
      HSBC: 'TRANSFERENCIA',
      AMEX: 'TARJETA',
      ELEKTRA: 'EFECTIVO_ELEKTRA',
      SORIANA: 'EFECTIVO_SORIANA',
      SUPERQ: 'EFECTIVO_SUPERQ',
      REGALII: 'EFECTIVO_REGALII',
      SCOTIABANK: 'TRANSFERENCIA',
    };
    return map[recaudador.toUpperCase()] ?? 'EFECTIVO';
  }
}
