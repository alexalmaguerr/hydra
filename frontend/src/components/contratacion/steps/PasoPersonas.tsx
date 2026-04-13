import { useState } from 'react';
import type { PersonaWizard, StepProps } from '../hooks/useWizardState';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_TITULAR: PersonaWizard = {
  tipoPersona: 'fisica',
  paterno: 'Pérez',
  materno: 'García',
  nombre: 'Juan',
  rfc: 'PEGJ800101ABC',
  documentoIdentificacion: 'INE-ABC123456',
  telefonos: '4421234567',
  email: 'juan.perez@ejemplo.com',
  usoCfdi: 'G03 - Gastos en general',
  regimenFiscal: '605 - Sueldos y Salarios e Ingresos Asimilados',
};

const DEMO_FISCAL: PersonaWizard = { ...DEMO_TITULAR };

const DEMO_CONTACTO: PersonaWizard = {
  tipoPersona: 'fisica',
  paterno: 'López',
  materno: 'Herrera',
  nombre: 'María',
  rfc: 'LOHM900202XYZ',
  telefonos: '4429876543',
  email: 'maria.lopez@ejemplo.com',
};

// ── PersonaBlock ──────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={error ? 'text-destructive' : ''}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">Campo obligatorio</p>}
    </div>
  );
}

function PersonaBlock({
  title,
  value,
  onChange,
  idPrefix,
  required,
  disabled,
  showErrors,
}: {
  title: string;
  value: PersonaWizard | undefined;
  onChange: (next: PersonaWizard) => void;
  idPrefix: string;
  required?: boolean;
  disabled?: boolean;
  showErrors?: boolean;
}) {
  const v = value ?? {};
  const patch = (partial: Partial<PersonaWizard>) => onChange({ ...v, ...partial });

  const err = (field: keyof PersonaWizard) =>
    required && showErrors && !v[field]?.toString().trim();

  return (
    <div className={`space-y-3 rounded-lg border bg-muted/20 p-4 ${disabled ? 'opacity-60' : ''}`}>
      <h3 className="text-sm font-semibold">
        {title}
        {required && <span className="ml-1 text-destructive">*</span>}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">

        {/* Tipo de persona */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className={err('tipoPersona') ? 'text-destructive' : ''}>
            Tipo de persona{required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
          <Select
            value={v.tipoPersona ?? ''}
            onValueChange={(val) => patch({ tipoPersona: val as 'fisica' | 'moral' })}
            disabled={disabled}
          >
            <SelectTrigger className={err('tipoPersona') ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Persona física</SelectItem>
              <SelectItem value="moral">Persona moral</SelectItem>
            </SelectContent>
          </Select>
          {err('tipoPersona') && <p className="text-xs text-destructive">Campo obligatorio</p>}
        </div>

        {/* Paterno */}
        <Field label="Apellido paterno" required={required} error={!!err('paterno')}>
          <Input
            id={`${idPrefix}-paterno`}
            value={v.paterno ?? ''}
            onChange={(e) => patch({ paterno: e.target.value })}
            disabled={disabled}
            className={err('paterno') ? 'border-destructive' : ''}
            autoComplete="family-name"
          />
        </Field>

        {/* Materno */}
        <div className="space-y-1.5">
          <Label>Apellido materno</Label>
          <Input
            id={`${idPrefix}-materno`}
            value={v.materno ?? ''}
            onChange={(e) => patch({ materno: e.target.value })}
            disabled={disabled}
            autoComplete="off"
          />
        </div>

        {/* Nombre */}
        <Field label="Nombre(s)" required={required} error={!!err('nombre')}>
          <Input
            id={`${idPrefix}-nombre`}
            value={v.nombre ?? ''}
            onChange={(e) => patch({ nombre: e.target.value })}
            disabled={disabled}
            className={err('nombre') ? 'border-destructive' : ''}
            autoComplete="given-name"
          />
        </Field>

        {/* Razón Social */}
        <div className="space-y-1.5">
          <Label>Razón social</Label>
          <Input
            id={`${idPrefix}-rs`}
            value={v.razonSocial ?? ''}
            onChange={(e) => patch({ razonSocial: e.target.value })}
            disabled={disabled}
          />
        </div>

        {/* Documento de identificación */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Documento de identificación</Label>
          <Input
            id={`${idPrefix}-doc`}
            value={v.documentoIdentificacion ?? ''}
            onChange={(e) => patch({ documentoIdentificacion: e.target.value })}
            disabled={disabled}
            placeholder="Ej: INE, Pasaporte"
          />
        </div>

        {/* RFC */}
        <Field label="RFC" required={required} error={!!err('rfc')}>
          <Input
            id={`${idPrefix}-rfc`}
            value={v.rfc ?? ''}
            onChange={(e) => patch({ rfc: e.target.value })}
            disabled={disabled}
            className={`font-mono text-sm ${err('rfc') ? 'border-destructive' : ''}`}
            placeholder="Sin RFC: XAXX010101000"
            autoComplete="off"
          />
        </Field>

        {/* Teléfonos */}
        <div className="space-y-1.5">
          <Label>Teléfonos de contacto</Label>
          <Input
            id={`${idPrefix}-tel`}
            value={v.telefonos ?? ''}
            onChange={(e) => patch({ telefonos: e.target.value })}
            disabled={disabled}
            autoComplete="tel"
          />
        </div>

        {/* Correo */}
        <div className="space-y-1.5">
          <Label>Correo electrónico</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            value={v.email ?? ''}
            onChange={(e) => patch({ email: e.target.value })}
            disabled={disabled}
            autoComplete="email"
          />
        </div>

        {/* Uso del CFDI */}
        <div className="space-y-1.5">
          <Label>Uso del CFDI</Label>
          <Input
            id={`${idPrefix}-cfdi`}
            value={v.usoCfdi ?? ''}
            onChange={(e) => patch({ usoCfdi: e.target.value })}
            disabled={disabled}
            placeholder="Ej: G03 - Gastos en general"
          />
        </div>

        {/* Régimen fiscal */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Régimen fiscal</Label>
          <Input
            id={`${idPrefix}-reg`}
            value={v.regimenFiscal ?? ''}
            onChange={(e) => patch({ regimenFiscal: e.target.value })}
            disabled={disabled}
            placeholder="Ej: 605 - Sueldos y Salarios"
          />
        </div>
      </div>
    </div>
  );
}

// ── PasoPersonas ──────────────────────────────────────────────────────────────

export default function PasoPersonas({ data, updateData }: StepProps) {
  const [fiscalIgualTitular, setFiscalIgualTitular] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handlePropietarioChange = (next: PersonaWizard) => {
    if (fiscalIgualTitular) {
      updateData({ propietario: next, personaFiscal: { ...next } });
    } else {
      updateData({ propietario: next });
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
    setShowErrors(false);
    updateData({
      propietario: { ...DEMO_TITULAR },
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
            Titular y persona fiscal son obligatorios (<span className="text-destructive">*</span>).
            Contacto es opcional.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillDemo}
          className="shrink-0 text-xs"
        >
          Prellenar demo
        </Button>
      </div>

      <PersonaBlock
        title="Propietario / titular"
        idPrefix="prop"
        value={data.propietario}
        onChange={handlePropietarioChange}
        required
        showErrors={showErrors}
      />

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
        showErrors={showErrors}
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
