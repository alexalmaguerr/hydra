import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { StepProps } from '../hooks/useWizardState';

const CATALOGO_DOCUMENTOS: { id: string; nombre: string }[] = [
  { id: '1', nombre: 'Certificado de Número Oficial (COPIA)' },
  { id: '2', nombre: 'Identificación Oficial (COPIA)' },
  { id: '3', nombre: 'Constancia de Propiedad (ORIGINAL Y COPIA)' },
  { id: '5', nombre: 'Certificado de Conexión para Toma de Agua (ORIGINAL)' },
  { id: '6', nombre: 'Póliza de Garantía o Acta de Entrega de la Vivienda (COPIA)' },
  { id: '7', nombre: 'Acta Constitutiva de la Asociación de Condóminos (COPIA)' },
  { id: '8', nombre: 'Identificación Oficial del Representante de la Asociación (COPIA)' },
  { id: '9', nombre: 'Documento que lo Avale como Propietario (COPIA)' },
  { id: '10', nombre: 'Croquis de Ubicación del Predio' },
  { id: '11', nombre: 'Carta de Adhesión y/o Convenio' },
  { id: '12', nombre: 'Expediente Documentos Factibilidades' },
  { id: '13', nombre: 'Expediente Documentos Regularizaciones' },
  { id: '14', nombre: 'Formato de Solicitud de Baja Definitiva (ORIGINAL Y COPIA)' },
  { id: '15', nombre: 'Petición por Escrito (ORIGINAL)' },
  { id: '16', nombre: 'IFE Representante o Titular del Hidrante (COPIA)' },
  { id: '17', nombre: 'IFE del Representante de cada Familia Beneficiada (COPIA)' },
  { id: '18', nombre: 'Solicitud por Escrito' },
  { id: '19', nombre: 'Identificación Oficial del Representante (COPIA)' },
  { id: '20', nombre: 'Identificación Oficial de 2 Testigos (COPIA)' },
  { id: '21', nombre: 'Carta Poder Simple (ORIGINAL)' },
  { id: '22', nombre: 'Acta (COPIA)' },
  { id: '23', nombre: 'RFC (Cédula) (COPIA)' },
  { id: '24', nombre: 'Poder del Representante Legal (COPIA)' },
  { id: '41', nombre: 'Uso de Suelo' },
];

export default function PasoDocumentos({ data, updateData, config }: StepProps) {
  const [selDisponible, setSelDisponible] = useState<string>('');
  const [selEntregado, setSelEntregado] = useState<string>('');

  const entregados = data.documentosRecibidos;

  const catalogo = useMemo(() => {
    if (config?.documentos?.length) {
      return config.documentos.map((d) => ({
        id: d.id,
        nombre: (d.nombreDocumento ?? '').trim() || d.id,
      }));
    }
    return CATALOGO_DOCUMENTOS;
  }, [config?.documentos]);

  const disponibles = useMemo(
    () => catalogo.filter((d) => !entregados.includes(d.nombre)),
    [catalogo, entregados],
  );

  const moverADerecha = () => {
    const doc = catalogo.find((d) => d.id === selDisponible);
    if (!doc) return;
    updateData({ documentosRecibidos: [...entregados, doc.nombre] });
    setSelDisponible('');
  };

  const moverAIzquierda = () => {
    if (!selEntregado) return;
    updateData({ documentosRecibidos: entregados.filter((n) => n !== selEntregado) });
    setSelEntregado('');
  };

  return (
    <section aria-labelledby="paso-documentos" className="space-y-4">
      <div>
        <h2 id="paso-documentos" className="text-base font-semibold">
          Documentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Catálogo disponible (izquierda) y documentación recibida del cliente (derecha). Los nombres se envían al
          backend como en el flujo actual.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div className="flex min-h-[220px] flex-col rounded-lg border bg-muted/10">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Disponibles
          </div>
          <div
            className="flex-1 overflow-y-auto p-1"
            role="listbox"
            aria-label="Documentos disponibles en catálogo"
          >
            {disponibles.map((d) => (
              <button
                key={d.id}
                type="button"
                role="option"
                aria-selected={selDisponible === d.id}
                onClick={() => setSelDisponible(d.id)}
                className={`flex w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selDisponible === d.id ? 'bg-primary/15 text-foreground' : 'hover:bg-muted/60'
                }`}
              >
                {d.nombre}
              </button>
            ))}
            {disponibles.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No quedan documentos por agregar.</p>
            )}
          </div>
        </div>

        <div className="flex flex-row justify-center gap-2 sm:flex-col sm:justify-center">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            disabled={!selDisponible}
            onClick={moverADerecha}
            aria-label="Marcar documento seleccionado como recibido"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="shrink-0"
            disabled={!selEntregado}
            onClick={moverAIzquierda}
            aria-label="Quitar documento seleccionado de los recibidos"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-lg border bg-muted/10">
          <div className="border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Entregados por el cliente
          </div>
          <div
            className="flex-1 overflow-y-auto p-1"
            role="listbox"
            aria-label="Documentos recibidos"
          >
            {entregados.map((nombre) => (
              <button
                key={nombre}
                type="button"
                role="option"
                aria-selected={selEntregado === nombre}
                onClick={() => setSelEntregado(nombre)}
                className={`flex w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                  selEntregado === nombre ? 'bg-primary/15 text-foreground' : 'hover:bg-muted/60'
                }`}
              >
                {nombre}
              </button>
            ))}
            {entregados.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Aún no hay documentos en esta lista.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Label className="sr-only" htmlFor="doc-count-resumen">
          Resumen
        </Label>
        <span id="doc-count-resumen" role="status">
          {entregados.length} documento(s) marcados como recibidos.
        </span>
      </div>
    </section>
  );
}
