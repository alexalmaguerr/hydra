import type { StepProps } from '../hooks/useWizardState';

export default function PasoServicioPoint(_props: StepProps) {
  return (
    <section aria-labelledby="paso-punto-servicio" className="space-y-2">
      <h2 id="paso-punto-servicio" className="text-base font-semibold">
        Punto de servicio
      </h2>
      <p className="text-sm text-muted-foreground">Seleccione o capture el punto de servicio del contrato.</p>
    </section>
  );
}
