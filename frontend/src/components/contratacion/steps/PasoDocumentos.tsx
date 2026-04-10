import type { StepProps } from '../hooks/useWizardState';

export default function PasoDocumentos(_props: StepProps) {
  return (
    <section aria-labelledby="paso-documentos" className="space-y-2">
      <h2 id="paso-documentos" className="text-base font-semibold">
        Documentos
      </h2>
      <p className="text-sm text-muted-foreground">Checklist de documentación recibida.</p>
    </section>
  );
}
