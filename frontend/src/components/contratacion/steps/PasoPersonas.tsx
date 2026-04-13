import { useState } from 'react';
import type { PersonaWizard, StepProps } from '../hooks/useWizardState';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_PROPIETARIO: PersonaWizard = {
  nombre: 'Juan Pérez García',
  rfc: 'PEGJ800101ABC',
  curp: 'PEGJ800101HQRRRC01',
  email: 'juan.perez@ejemplo.com',
  telefono: '4421234567',
  razonSocial: '',
  regimenFiscal: 'Persona Física con Actividad Empresarial',
};

const DEMO_FISCAL: PersonaWizard = {
  nombre: 'Juan Pérez García',
  rfc: 'PEGJ800101ABC',
  curp: 'PEGJ800101HQRRRC01',
  email: 'juan.perez@ejemplo.com',
  telefono: '4421234567',
  razonSocial: '',
  regimenFiscal: 'Persona Física con Actividad Empresarial',
};

const DEMO_CONTACTO: PersonaWizard = {
  nombre: 'María López Herrera',
  email: 'maria.lopez@ejemplo.com',
  telefono: '4429876543',
};

function PersonaBlock({
  title,
  value,
  onChange,
  idPrefix,
  required,
  disabled,
}: {
  title: string;
  value: PersonaWizard | undefined;
  onChange: (next: PersonaWizard) => void;
  idPrefix: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const v = value ?? {};
  const patch = (partial: Partial<PersonaWizard>) => onChange({ ...v, ...partial });
  const nombreMissing = required && !v.nombre?.trim();

  return (
    <div className={`space-y-3 rounded-lg border bg-muted/20 p-4 ${disabled ? 'opacity-60' : ''}`}>
      <h3 className="text-sm font-semibold">
        {title}
        {required && <span className="ml-1 text-destructive">*</span>}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-nombre`}>
            Nombre{required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          <Input
            id={`${idPrefix}-nombre`}
            value={v.nombre ?? ''}
            onChange={(e) => patch({ nombre: e.target.value })}
            autoComplete="name"
            disabled={disabled}
            className={nombreMissing ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {nombreMissing && (
            <p className="text-xs text-destructive">El nombre es obligatorio</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rfc`}>RFC</Label>
          <Input
            id={`${idPrefix}-rfc`}
            value={v.rfc ?? ''}
            onChange={(e) => patch({ rfc: e.target.value })}
            className="font-mono text-sm"
            autoComplete="off"
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-tel`}>Teléfono</Label>
          <Input
            id={`${idPrefix}-tel`}
            value={v.telefono ?? ''}
            onChange={(e) => patch({ telefono: e.target.value })}
            autoComplete="tel"
            disabled={disabled}
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
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`${idPrefix}-reg`}>Régimen fiscal (opcional)</Label>
              <Input
                id={`${idPrefix}-reg`}
                value={v.regimenFiscal ?? ''}
                onChange={(e) => patch({ regimenFiscal: e.target.value })}
                disabled={disabled}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PasoPersonas({ data, updateData }: StepProps) {
  const [fiscalIgualTitular, setFiscalIgualTitular] = useState(false);

  const handlePropietarioChange = (next: PersonaWizard) => {
    updateData({ propietario: next });
    if (fiscalIgualTitular) {
      updateData({ propietario: next, personaFiscal: { ...next } });
    }
  };

  const handleFiscalIgualTitular = (checked: boolean) => {
    setFiscalIgualTitular(checked);
    if (checked) {
      updateData({ personaFiscal: { ...(data.propietario ?? {}) } });
    }
  };

  const fillDemo = () => {
    setFiscalIgualTitular(false);
    updateData({
      propietario: { ...DEMO_PROPIETARIO },
      personaFiscal: { ...DEMO_FISCAL },
      personaContacto: { ...DEMO_CONTACTO },
    });
  };

  return (
    <section aria-labelledby="paso-personas" className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="paso-personas" className="text-base font-semibold">
            Personas
          </h2>
          <p className="text-sm text-muted-foreground">
            Propietario/titular y persona fiscal son obligatorios. Contacto es opcional.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={fillDemo} className="shrink-0 text-xs">
          Prellenar demo
        </Button>
      </div>

      <PersonaBlock
        title="Propietario / titular"
        idPrefix="prop"
        value={data.propietario}
        onChange={handlePropietarioChange}
        required
      />

      {/* Checkbox fiscal = titular */}
      <label className="flex cursor-pointer items-center gap-2 px-1">
        <Checkbox
          checked={fiscalIgualTitular}
          onCheckedChange={(v) => handleFiscalIgualTitular(!!v)}
        />
        <span className="text-sm">La persona fiscal es la misma que el titular</span>
      </label>

      <PersonaBlock
        title="Persona fiscal"
        idPrefix="fiscal"
        value={data.personaFiscal}
        onChange={(next) => updateData({ personaFiscal: next })}
        required
        disabled={fiscalIgualTitular}
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
