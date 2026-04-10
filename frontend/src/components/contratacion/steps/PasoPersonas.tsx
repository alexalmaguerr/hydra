import type { StepProps } from '../hooks/useWizardState';

export default function PasoPersonas(_props: StepProps) {
  return (
    <section aria-labelledby="paso-personas" className="space-y-2">
      <h2 id="paso-personas" className="text-base font-semibold">
        Personas
      </h2>
      <p className="text-sm text-muted-foreground">Propietario, persona fiscal y contacto.</p>
    </section>
  );
}
