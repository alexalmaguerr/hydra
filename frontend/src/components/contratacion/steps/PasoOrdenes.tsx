import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { StepProps } from '@/components/contratacion/hooks/useWizardState';

export default function PasoOrdenes({ data, updateData }: StepProps) {
  const toma = data.generarOrdenInstalacionToma;
  const medidor = data.generarOrdenInstalacionMedidor;

  let mensajeFlujo: string;
  if (toma) {
    mensajeFlujo =
      'Se creará una orden de instalación de toma. Al completarla, se generará automáticamente la orden de medidor.';
  } else if (medidor) {
    mensajeFlujo = 'Se creará directamente la orden de instalación de medidor.';
  } else {
    mensajeFlujo = 'No se generarán órdenes de trabajo.';
  }

  let estadoInicial: string;
  if (toma) {
    estadoInicial = 'Estado inicial: Pendiente de toma';
  } else if (medidor) {
    estadoInicial = 'Estado inicial: Pendiente de zona';
  } else {
    estadoInicial = 'Estado según configuración';
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="orden-toma" className="text-base">
              Generar orden de instalación de toma
            </Label>
            <p className="text-sm text-muted-foreground">
              Activa la ruta en la que primero se instala la toma en campo.
            </p>
          </div>
          <Switch
            id="orden-toma"
            checked={toma}
            onCheckedChange={(checked) => updateData({ generarOrdenInstalacionToma: checked })}
            aria-label="Generar orden de instalación de toma"
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="orden-medidor" className="text-base">
              Generar orden de instalación de medidor
            </Label>
            <p className="text-sm text-muted-foreground">
              Programa la instalación o colocación del medidor según corresponda.
            </p>
          </div>
          <Switch
            id="orden-medidor"
            checked={medidor}
            onCheckedChange={(checked) => updateData({ generarOrdenInstalacionMedidor: checked })}
            aria-label="Generar orden de instalación de medidor"
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{mensajeFlujo}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-foreground">{estadoInicial}</p>
        </CardContent>
      </Card>
    </div>
  );
}
