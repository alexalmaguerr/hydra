import type { StepProps } from '../hooks/useWizardState';

export default function PasoVariables(_props: StepProps) {
  return (
    <section aria-labelledby="paso-variables" className="space-y-2">
      <h2 id="paso-variables" className="text-base font-semibold">
        Variables
      </h2>
      <p className="text-sm text-muted-foreground">Variables definidas para el tipo de contratación.</p>
    </section>
  );
}
