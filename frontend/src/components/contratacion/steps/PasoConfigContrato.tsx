import type { StepProps } from '../hooks/useWizardState';

export default function PasoConfigContrato(_props: StepProps) {
  return (
    <section aria-labelledby="paso-config" className="space-y-2">
      <h2 id="paso-config" className="text-base font-semibold">
        Configuración del contrato
      </h2>
      <p className="text-sm text-muted-foreground">Tipo de contratación, actividad y referencias.</p>
    </section>
  );
}
