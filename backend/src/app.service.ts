import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { ok: boolean; ts: string } {
    return { ok: true, ts: new Date().toISOString() };
  }
}
