import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Paperclip, X } from 'lucide-react';
import { fetchCatalogoSat, type CatalogoSatItem } from '@/api/catalogos';
import { hasApi } from '@/api/client';
import {
  REGIMEN_FISCAL_OFFLINE,
  USO_CFDI_OFFLINE,
  regimenClaveFromStored,
  usoCfdiClaveFromStored,
  usoCfdiMatchesRegimenSeleccionado,
} from '@/lib/sat-catalog-fallback';

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_TITULAR: PersonaWizard = {
  tipoPersona: 'fisica',
  paterno: 'Pérez',
  materno: 'García',
  nombre: 'Juan',
  rfc: 'PEGJ800101ABC',
  documentoIdentificacion: '',
  telefonos: '4421234567',
  email: 'juan.perez@ejemplo.com',
  usoCfdi: 'G03',
  regimenFiscal: '605',
};

const DEMO_FISCAL: PersonaWizard = { ...DEMO_TITULAR };

const DEMO_CONTACTO: PersonaWizard = {
  tipoPersona: 'fisica',
  paterno: 'López',
  nombre: 'María',
  telefonos: '4429876543',
  email: 'maria.lopez@ejemplo.com',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── DocumentoUpload ───────────────────────────────────────────────────────────

function DocumentoUpload({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(file.name);
  };

  return (
    <div className="space-y-1.5">
      <Label>Documento de identificación oficial</Label>
      <p className="text-xs text-muted-foreground">
        Puede ser acta de nacimiento, INE o pasaporte.
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => ref.current?.click()}
          className="gap-1.5"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {value ? 'Cambiar archivo' : 'Seleccionar archivo'}
        </Button>
        {value && (
          <span className="flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[200px] truncate">{value}</span>
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                onChange('');
                if (ref.current) ref.current.value = '';
              }}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFile}
        disabled={disabled}
      />
    </div>
  );
}

// ── PersonaBlock (propietario / fiscal) ───────────────────────────────────────

function PersonaBlock({
  title,
  value,
  onChange,
  idPrefix,
  required,
  disabled,
  showErrors,
  regimenSat,
  usoSat,
  satPending,
}: {
  title: string;
  value: PersonaWizard | undefined;
  onChange: (next: PersonaWizard) => void;
  idPrefix: string;
  required?: boolean;
  disabled?: boolean;
  showErrors?: boolean;
  regimenSat: CatalogoSatItem[];
  usoSat: CatalogoSatItem[];
  satPending: boolean;
}) {
  const v = value ?? {};
  const patch = (partial: Partial<PersonaWizard>) => onChange({ ...v, ...partial });
  const useApi = hasApi();

  const err = (field: keyof PersonaWizard) =>
    required && showErrors && !v[field]?.toString().trim();

  const tipoPersona = v.tipoPersona;
  const esFisica = tipoPersona === 'fisica';
  const esMoral = tipoPersona === 'moral';
  const tipoOk = esFisica || esMoral;

  const regimenSel = regimenClaveFromStored(v.regimenFiscal);
  const usoSel = usoCfdiClaveFromStored(v.usoCfdi);

  const regimenOpciones = useMemo(() => {
    if (!tipoOk) return [] as { clave: string; texto: string }[];
    if (regimenSat.length > 0) {
      return regimenSat
        .filter((r) => (esFisica ? r.aplicaFisica : r.aplicaMoral))
        .map((r) => ({ clave: r.clave, texto: r.descripcion }));
    }
    return REGIMEN_FISCAL_OFFLINE.filter((r) => (esFisica ? r.aplicaFisica : r.aplicaMoral)).map((r) => ({
      clave: r.id,
      texto: r.nombre,
    }));
  }, [regimenSat, esFisica, tipoOk]);

  const usoOpciones = useMemo(() => {
    if (!tipoOk || regimenSel === '') return [] as { clave: string; texto: string }[];
    if (usoSat.length > 0) {
      const rows = usoSat.filter((u) => {
        if (esFisica ? !u.aplicaFisica : !u.aplicaMoral) return false;
        return usoCfdiMatchesRegimenSeleccionado(u.regimenesReceptorPermitidos, regimenSel);
      });
      return rows.map((u) => ({ clave: u.clave, texto: u.descripcion }));
    }
    const rows = USO_CFDI_OFFLINE.filter((u) => {
      if (esFisica ? !u.aplicaFisica : !u.aplicaMoral) return false;
      return usoCfdiMatchesRegimenSeleccionado(u.regimenesReceptorPermitidos, regimenSel);
    });
    return rows.map((u) => ({ clave: u.id, texto: u.nombre }));
  }, [usoSat, esFisica, regimenSel, tipoOk]);

  useEffect(() => {
    if (!tipoOk) return;
    const rcl = regimenClaveFromStored(v.regimenFiscal);
    if (rcl && !regimenOpciones.some((o) => o.clave === rcl)) {
      patch({ regimenFiscal: '', usoCfdi: '' });
      return;
    }
    const ucl = usoCfdiClaveFromStored(v.usoCfdi);
    if (ucl && !usoOpciones.some((o) => o.clave === ucl)) {
      patch({ usoCfdi: '' });
    }
    // patch cierra sobre el estado actual de `v`; incluirla rompería el ciclo de deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoOk, regimenOpciones, usoOpciones, v.regimenFiscal, v.usoCfdi]);

  const satBloqueado = disabled || (useApi && satPending);
  const regimenDisabled = satBloqueado || !tipoOk;
  const usoDisabled = satBloqueado || !tipoOk || !regimenSel;

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
            onValueChange={(val) =>
              patch({
                tipoPersona: val as 'fisica' | 'moral',
                regimenFiscal: '',
                usoCfdi: '',
              })
            }
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

        {/* Régimen fiscal y Uso del CFDI (GET /catalogos/sat o fallback offline) */}
        <div className="space-y-1.5">
          <Label>Régimen fiscal</Label>
          <SearchableSelect
            value={regimenSel ?? ''}
            onValueChange={(nv) => patch({ regimenFiscal: nv, usoCfdi: '' })}
            disabled={regimenDisabled}
            placeholder={
              !tipoOk
                ? 'Primero elija tipo de persona…'
                : useApi && satPending
                  ? 'Cargando catálogo SAT…'
                  : 'Seleccione régimen…'
            }
            searchPlaceholder="Buscar régimen fiscal…"
            options={regimenOpciones.map((r) => ({ value: r.clave, label: `${r.clave} — ${r.texto}` }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Uso del CFDI</Label>
          <SearchableSelect
            value={usoSel ?? ''}
            onValueChange={(nv) => patch({ usoCfdi: nv })}
            disabled={usoDisabled}
            placeholder={
              !tipoOk
                ? 'Primero elija tipo de persona…'
                : !regimenSel
                  ? 'Primero elija régimen fiscal…'
                  : useApi && satPending
                    ? 'Cargando catálogo SAT…'
                    : 'Seleccione uso…'
            }
            searchPlaceholder="Buscar uso del CFDI…"
            options={usoOpciones.map((u) => ({ value: u.clave, label: `${u.clave} — ${u.texto}` }))}
          />
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

        {/* Documento de identificación oficial */}
        <div className="sm:col-span-2">
          <DocumentoUpload
            value={v.documentoIdentificacion ?? ''}
            onChange={(name) => patch({ documentoIdentificacion: name })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

// ── ContactoBlock ──────────────────────────────────────────────────────────────

function ContactoBlock({
  value,
  onChange,
}: {
  value: PersonaWizard | undefined;
  onChange: (next: PersonaWizard) => void;
}) {
  const v = value ?? {};
  const patch = (partial: Partial<PersonaWizard>) => onChange({ ...v, ...partial });

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">Contacto (opcional)</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Apellido paterno</Label>
          <Input
            value={v.paterno ?? ''}
            onChange={(e) => patch({ paterno: e.target.value })}
            autoComplete="family-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Nombre(s)</Label>
          <Input
            value={v.nombre ?? ''}
            onChange={(e) => patch({ nombre: e.target.value })}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfonos</Label>
          <Input
            value={v.telefonos ?? ''}
            onChange={(e) => patch({ telefonos: e.target.value })}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Correo electrónico</Label>
          <Input
            type="email"
            value={v.email ?? ''}
            onChange={(e) => patch({ email: e.target.value })}
            autoComplete="email"
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
  const useApi = hasApi();

  const { data: regimenSat = [], isPending: regPending } = useQuery({
    queryKey: ['catalogos', 'sat', 'REGIMEN_FISCAL'],
    queryFn: () => fetchCatalogoSat('REGIMEN_FISCAL'),
    enabled: useApi,
  });
  const { data: usoSat = [], isPending: usoPending } = useQuery({
    queryKey: ['catalogos', 'sat', 'USO_CFDI'],
    queryFn: () => fetchCatalogoSat('USO_CFDI'),
    enabled: useApi,
  });
  const satPending = useApi && (regPending || usoPending);

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
            Contacto es opcional. Tras elegir tipo de persona, régimen fiscal y uso del CFDI se filtran
            desde el catálogo SAT del backend.
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
        regimenSat={regimenSat}
        usoSat={usoSat}
        satPending={satPending}
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
        regimenSat={regimenSat}
        usoSat={usoSat}
        satPending={satPending}
      />

      <ContactoBlock
        value={data.personaContacto}
        onChange={(next) => updateData({ personaContacto: next })}
      />
    </section>
  );
}
