import type { PrismaClient } from '@prisma/client';

/**
 * Hito inicial al abrir un proceso: etapa solicitud completada (alineado con ETAPAS_FLUJO).
 * Usar con PrismaClient o con el cliente de una transacción interactiva.
 */
export async function crearHitoInicialSolicitudCompletado(
  db: Pick<PrismaClient, 'hitoContratacion'>,
  procesoId: string,
  usuario: string | null,
): Promise<void> {
  await db.hitoContratacion.create({
    data: {
      procesoId,
      etapa: 'solicitud',
      estado: 'completado',
      nota: 'Proceso iniciado',
      usuario,
      fechaCumpl: new Date(),
    },
  });
}
