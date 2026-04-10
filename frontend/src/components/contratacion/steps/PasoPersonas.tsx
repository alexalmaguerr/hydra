import type { PersonaWizard, StepProps } from '../hooks/useWizardState';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PersonaBlock({
  title,
  value,
  onChange,
  idPrefix,
}: {
  title: string;
  value: PersonaWizard | undefined;
  onChange: (next: PersonaWizard) => void;
  idPrefix: string;
}) {
  const v = value ?? {};
  const patch = (partial: Partial<PersonaWizard>) => onChange({ ...v, ...partial });

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-nombre`}>Nombre</Label>
          <Input
            id={`${idPrefix}-nombre`}
            value={v.nombre ?? ''}
            onChange={(e) => patch({ nombre: e.target.value })}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rfc`}>RFC</Label>
          <Input
            id={`${idPrefix}-rfc`}
            value={v.rfc ?? ''}
            onChange={(e) => patch({ rfc: e.target.value })}
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-curp`}>CURP</Label>
          <Input
            id={`${idPrefix}-curp`}
            value={v.curp ?? ''}
            onChange={(e) => patch({ curp: e.target.value })}
            className="font-mono text-sm"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-email`}>Correo</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={v.email ?? ''}
            onChange={(e) => patch({ email: e.target.value })}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-tel`}>Teléfono</Label>
          <Input
            id={`${idPrefix}-tel`}
            value={v.telefono ?? ''}
            onChange={(e) => patch({ telefono: e.target.value })}
            autoComplete="tel"
          />
        </div>
        {(idPrefix === 'fiscal' || idPrefix === 'prop') && (
          <>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-rs`}>Razón social (opcional)</Label>
              <Input
                id={`${idPrefix}-rs`}
                value={v.razonSocial ?? ''}
                onChange={(e) => patch({ razonSocial: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-reg`}>Régimen fiscal (opcional)</Label>
              <Input
                id={`${idPrefix}-reg`}
                value={v.regimenFiscal ?? ''}
                onChange={(e) => patch({ regimenFiscal: e.target.value })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PasoPersonas({ data, updateData }: StepProps) {
  return (
    <section aria-labelledby="paso-personas" className="space-y-4">
      <div>
        <h2 id="paso-personas" className="text-base font-semibold">
          Personas
        </h2>
        <p className="text-sm text-muted-foreground">
          Propietario o titular, persona fiscal y contacto (opcional).
        </p>
      </div>

      <PersonaBlock
        title="Propietario / titular"
        idPrefix="prop"
        value={data.propietario}
        onChange={(next) => updateData({ propietario: next })}
      />
      <PersonaBlock
        title="Persona fiscal"
        idPrefix="fiscal"
        value={data.personaFiscal}
        onChange={(next) => updateData({ personaFiscal: next })}
      />
      <PersonaBlock
        title="Contacto (opcional)"
        idPrefix="contacto"
        value={data.personaContacto}
        onChange={(next) => updateData({ personaContacto: next })}
      />
    </section>
  );
}
