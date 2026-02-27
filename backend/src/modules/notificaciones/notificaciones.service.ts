import { Injectable, Logger } from '@nestjs/common';

export interface NotificacionEmail {
  destinatario: string;
  asunto: string;
  cuerpo: string;
  folio?: string;
}

export interface NotificacionWhatsApp {
  telefono: string;
  mensaje: string;
  folio?: string;
}

/**
 * NotificacionesService — stub implementation.
 * Logs to console now; replace method bodies with real provider calls
 * (SendGrid, Twilio, etc.) when credentials are available.
 */
@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  async enviarEmail(data: NotificacionEmail): Promise<{ enviado: boolean; mock: boolean }> {
    this.logger.log(
      `[EMAIL STUB] Para: ${data.destinatario} | Asunto: ${data.asunto} | Folio: ${data.folio ?? 'N/A'}`,
    );
    // TODO: replace with real email provider (e.g., SendGrid)
    // await this.sendgrid.send({ to: data.destinatario, subject: data.asunto, html: data.cuerpo });
    return { enviado: true, mock: true };
  }

  async enviarWhatsApp(data: NotificacionWhatsApp): Promise<{ enviado: boolean; mock: boolean }> {
    this.logger.log(
      `[WHATSAPP STUB] Tel: ${data.telefono} | Folio: ${data.folio ?? 'N/A'} | Msg: ${data.mensaje.substring(0, 80)}`,
    );
    // TODO: replace with Twilio or similar
    // await this.twilio.messages.create({ to: `whatsapp:${data.telefono}`, body: data.mensaje });
    return { enviado: true, mock: true };
  }

  async notificarFolioTramite(params: {
    folio: string;
    tipo: string;
    email?: string;
    telefono?: string;
  }): Promise<void> {
    const { folio, tipo, email, telefono } = params;
    const msg = `Su trámite "${tipo}" ha sido registrado con folio: ${folio}. Guárdelo para seguimiento.`;

    if (email) {
      await this.enviarEmail({
        destinatario: email,
        asunto: `Folio de trámite: ${folio}`,
        cuerpo: `<p>${msg}</p>`,
        folio,
      });
    }
    if (telefono) {
      await this.enviarWhatsApp({ telefono, mensaje: msg, folio });
    }
  }
}
