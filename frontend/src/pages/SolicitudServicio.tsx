import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, FileText, MapPin, User, HelpCircle, Settings, Receipt, ClipboardCheck, Wand2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import DomicilioPickerForm from '@/components/contratacion/DomicilioPickerForm';
import { TIPOS_CONTRATACION_BY_ADMIN } from '@/config/tipos-contratacion';
import { cn } from '@/lib/utils';
import type { SolicitudState } from '@/types/solicitudes';
import { SOLICITUD_STATE_EMPTY } from '@/types/solicitudes';
import { useSolicitudesStore } from '@/hooks/useSolicitudesStore';

// ── Catalogues ───────────────────────────────────────────────────────────────

const ADMINISTRACIONES: Record<string, string> = {
  '1': 'QUERÉTARO',
  '2': 'SANTA ROSA JÁUREGUI',
  '3': 'CORREGIDORA',
  '4': 'PEDRO ESCOBEDO',
  '5': 'TEQUISQUIAPAN',
  '6': 'EZEQUIEL MONTES',
  '7': 'AMEALCO DE BONFIL',
  '8': 'HUIMILPAN',
  '9': 'CADEREYTA DE MONTES-SAN JOAQUÍN',
  '10': 'COLÓN-TOLIMÁN',
  '11': 'JALPAN DE SERRA-LANDA DE MATAMOROS-ARROYO SECO',
  '12': 'EL MARQUÉS',
  '13': 'PINAL DE AMOLES-PEÑAMILLER',
};

const REGIMENES_FISCALES = [
  { id: '601', nombre: 'General de Ley Personas Morales' },
  { id: '603', nombre: 'Personas Morales con Fines no Lucrativos' },
  { id: '605', nombre: 'Sueldos y Salarios e Ingresos Asimilados' },
  { id: '606', nombre: 'Arrendamiento' },
  { id: '612', nombre: 'Personas Físicas con Actividades Empresariales' },
  { id: '616', nombre: 'Sin obligaciones fiscales' },
  { id: '621', nombre: 'Incorporación Fiscal' },
  { id: '622', nombre: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { id: '626', nombre: 'Régimen Simplificado de Confianza' },
];

const USOS_CFDI = [
  { id: 'G01', nombre: 'Adquisición de mercancias' },
  { id: 'G03', nombre: 'Gastos en general' },
  { id: 'I01', nombre: 'Construcciones' },
  { id: 'S01', nombre: 'Sin efectos fiscales' },
  { id: 'CP01', nombre: 'Pagos' },
  { id: 'CN01', nombre: 'Nómina' },
];

// ── Mock data for demos ───────────────────────────────────────────────────────

// Data split per wizard step so prellenar can fill them one by one
const MOCK_STEP_DATA: Partial<SolicitudState>[] = [
  // 0 – Predio
  {
    claveCatastral: '22001-045-012',
    folioExpediente: '',
    predioDir: {
      estadoINEGIId: '22',
      municipioINEGIId: '22014',
      localidadINEGIId: '',
      coloniaINEGIId: '',
      codigoPostal: '76030',
      calle: 'Av. Constituyentes',
      numExterior: '425',
      numInterior: '',
      referencia: 'Entre Av. 5 de Febrero y calle Hidalgo',
    },
    predioManzana: '12',
    predioLote: '04',
    superficieTotal: '180',
    superficieConstruida: '120',
  },
  // 1 – Propietario
  {
    propTipoPersona: 'fisica',
    propPaterno: 'García',
    propMaterno: 'Ramírez',
    propNombre: 'María Elena',
    propRazonSocial: '',
    propRfc: 'GARM850312AB3',
    propCorreo: 'mgarcia@correo.com',
    propTelefono: '4421234567',
    propDir: {
      estadoINEGIId: '22',
      municipioINEGIId: '22014',
      localidadINEGIId: '',
      coloniaINEGIId: '',
      codigoPostal: '76030',
      calle: 'Calle Independencia',
      numExterior: '88',
      numInterior: 'Int. 3',
      referencia: '',
    },
    propManzana: '',
    propLote: '',
  },
  // 2 – Solicitud
  {
    usoDomestico: 'si',
    hayTuberias: 'si',
    hayInfraCEA: 'si',
    esCondominio: 'no',
    condoViviendas: '',
    condoUbicacionTomas: '',
    condoTieneMedidorMacro: '',
    condoNumMedidor: '',
    condoAreasComunes: '',
    condoNumAreas: '',
    condoAgrupacion: '',
    condoNombreAgrupacion: '',
    personasVivienda: '4',
    tieneCertConexion: 'si',
  },
  // 3 – Contratación
  {
    adminId: '1',
    contratoPadre: '',
  },
  // 4 – Fiscal
  {
    requiereFactura: 'si',
    mismosDatosProp: 'si',
    fiscalTipoPersona: 'fisica',
    fiscalRazonSocial: '',
    fiscalRfc: 'GARM850312AB3',
    fiscalCorreo: 'mgarcia@correo.com',
    fiscalDir: {
      estadoINEGIId: '22',
      municipioINEGIId: '22014',
      localidadINEGIId: '',
      coloniaINEGIId: '',
      codigoPostal: '76030',
      calle: 'Calle Independencia',
      numExterior: '88',
      numInterior: 'Int. 3',
      referencia: '',
    },
    fiscalRegimenFiscal: '616',
    fiscalUsoCfdi: 'G03',
  },
];

const MOCK_DATA: SolicitudState = {
  claveCatastral: '22001-045-012',
  folioExpediente: '',
  predioDir: {
    estadoINEGIId: '22',        // Querétaro
    municipioINEGIId: '22014',  // Querétaro (municipio)
    localidadINEGIId: '',
    coloniaINEGIId: '',
    codigoPostal: '76030',
    calle: 'Av. Constituyentes',
    numExterior: '425',
    numInterior: '',
    referencia: 'Entre Av. 5 de Febrero y calle Hidalgo',
  },
  predioManzana: '12',
  predioLote: '04',
  superficieTotal: '180',
  superficieConstruida: '120',
  propTipoPersona: 'fisica',
  propPaterno: 'García',
  propMaterno: 'Ramírez',
  propNombre: 'María Elena',
  propRazonSocial: '',
  propRfc: 'GARM850312AB3',
  propCorreo: 'mgarcia@correo.com',
  propTelefono: '4421234567',
  propDir: {
    estadoINEGIId: '22',
    municipioINEGIId: '22014',
    localidadINEGIId: '',
    coloniaINEGIId: '',
    codigoPostal: '76030',
    calle: 'Calle Independencia',
    numExterior: '88',
    numInterior: 'Int. 3',
    referencia: '',
  },
  propManzana: '',
  propLote: '',
  usoDomestico: 'si',
  hayTuberias: 'si',
  hayInfraCEA: 'si',
  esCondominio: 'no',
  condoViviendas: '',
  condoUbicacionTomas: '',
  condoTieneMedidorMacro: '',
  condoNumMedidor: '',
  condoAreasComunes: '',
  condoNumAreas: '',
  condoAgrupacion: '',
  condoNombreAgrupacion: '',
  personasVivienda: '4',
  tieneCertConexion: 'si',
  adminId: '1',
  tipoContratacionId: '101',   // primer tipo de admin 1
  contratoPadre: '',
  requiereFactura: 'si',
  mismosDatosProp: 'si',
  fiscalTipoPersona: 'fisica',
  fiscalRazonSocial: '',
  fiscalRfc: 'GARM850312AB3',
  fiscalCorreo: 'mgarcia@correo.com',
  fiscalDir: {
    estadoINEGIId: '22',
    municipioINEGIId: '22014',
    localidadINEGIId: '',
    coloniaINEGIId: '',
    codigoPostal: '76030',
    calle: 'Calle Independencia',
    numExterior: '88',
    numInterior: 'Int. 3',
    referencia: '',
  },
  fiscalRegimenFiscal: '616',
  fiscalUsoCfdi: 'G03',
};

// ── Wizard steps definition ───────────────────────────────────────────────────

const STEPS = [
  { key: 'predio',        label: 'Predio',        icon: MapPin },
  { key: 'propietario',   label: 'Propietario',   icon: User },
  { key: 'solicitud',     label: 'Solicitud',     icon: HelpCircle },
  { key: 'contratacion',  label: 'Contratación',  icon: Settings },
  { key: 'fiscal',        label: 'Fiscal',        icon: Receipt },
  { key: 'resumen',       label: 'Resumen',       icon: ClipboardCheck },
] as const;

type StepKey = typeof STEPS[number]['key'];

// ── Per-step validation ───────────────────────────────────────────────────────

function canAdvance(step: number, form: SolicitudState): boolean {
  switch (step) {
    case 0: // Predio — calle obligatoria
      return !!form.predioDir.calle.trim();
    case 1: // Propietario
      if (!form.propTipoPersona) return false;
      if (form.propTipoPersona === 'moral') return !!form.propRazonSocial.trim();
      return !!(form.propPaterno.trim() || form.propNombre.trim());
    case 2: // Solicitud
      return !!form.usoDomestico && !!form.hayTuberias;
    case 3: // Tipo de contratación
      return !!form.adminId && !!form.tipoContratacionId;
    case 4: // Fiscal
      return !!form.requiereFactura;
    case 5: // Resumen — always ok
      return true;
    default:
      return true;
  }
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function YesNo({
  id,
  value,
  onChange,
}: {
  id: string;
  value: 'si' | 'no' | '';
  onChange: (v: 'si' | 'no') => void;
}) {
  return (
    <RadioGroup id={id} value={value} onValueChange={(v) => onChange(v as 'si' | 'no')} className="flex flex-row gap-0">
      {(['si', 'no'] as const).map((opt) => (
        <Label
          key={opt}
          htmlFor={`${id}-${opt}`}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 border px-3.5 py-1.5 text-sm font-medium transition-colors select-none',
            opt === 'si' ? 'rounded-l-md border-r-0' : 'rounded-r-md',
            value === opt
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-input hover:bg-accent',
          )}
        >
          <RadioGroupItem id={`${id}-${opt}`} value={opt} className="sr-only" />
          {opt === 'si' ? 'Sí' : 'No'}
        </Label>
      ))}
    </RadioGroup>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function PillToggle({
  options,
  value,
  onChange,
  idPrefix,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  idPrefix: string;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <Label
          key={opt.value}
          htmlFor={`${idPrefix}-${i}`}
          className={cn(
            'flex cursor-pointer items-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors select-none',
            value === opt.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-accent',
          )}
        >
          <RadioGroupItem id={`${idPrefix}-${i}`} value={opt.value} className="sr-only" />
          {opt.label}
          {opt.sub && <span className="ml-1 text-xs font-normal opacity-70">{opt.sub}</span>}
        </Label>
      ))}
    </RadioGroup>
  );
}

// ── Step views ────────────────────────────────────────────────────────────────

function StepPredio({ form, set }: { form: SolicitudState; set: (p: Partial<SolicitudState>) => void }) {
  const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  return (
    <div className="space-y-6">
      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Clave catastral del predio">
          <Input className="h-9" placeholder="Ej. 22001-001-001" value={form.claveCatastral} onChange={(e) => set({ claveCatastral: e.target.value })} />
        </Field>
        <Field label="Fecha de solicitud">
          <Input className="h-9 bg-muted/40" value={today} readOnly />
        </Field>
        <Field label="Folio de expediente (factibilidades)">
          <Input className="h-9" placeholder="Folio expediente" value={form.folioExpediente} onChange={(e) => set({ folioExpediente: e.target.value })} />
        </Field>
      </div>

      <Separator />

      {/* Domicilio */}
      <div>
        <p className="mb-3 text-sm font-medium">
          Domicilio del predio <span className="text-destructive">*</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">Este dato persiste a través de todo el flujo y se usará para crear el punto de servicio.</span>
        </p>
        <DomicilioPickerForm value={form.predioDir} onChange={(v) => set({ predioDir: v })} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Manzana">
          <Input className="h-9" placeholder="MZ" value={form.predioManzana} onChange={(e) => set({ predioManzana: e.target.value })} />
        </Field>
        <Field label="Lote">
          <Input className="h-9" placeholder="LT" value={form.predioLote} onChange={(e) => set({ predioLote: e.target.value })} />
        </Field>
        <Field label="Superficie total (m²)">
          <Input className="h-9" type="number" min="0" placeholder="0.00" value={form.superficieTotal} onChange={(e) => set({ superficieTotal: e.target.value })} />
        </Field>
        <Field label="Superficie construida (m²)">
          <Input className="h-9" type="number" min="0" placeholder="0.00" value={form.superficieConstruida} onChange={(e) => set({ superficieConstruida: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function StepPropietario({ form, set }: { form: SolicitudState; set: (p: Partial<SolicitudState>) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipo de persona <span className="text-destructive">*</span></Label>
        <PillToggle
          idPrefix="prop-tipo"
          options={[{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]}
          value={form.propTipoPersona}
          onChange={(v) => set({ propTipoPersona: v as 'fisica' | 'moral', propPaterno: '', propMaterno: '', propNombre: '', propRazonSocial: '' })}
        />
      </div>

      {form.propTipoPersona === 'moral' && (
        <Field label="Razón social" required>
          <Input className="h-9" value={form.propRazonSocial} onChange={(e) => set({ propRazonSocial: e.target.value })} />
        </Field>
      )}
      {form.propTipoPersona === 'fisica' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Apellido paterno" required>
            <Input className="h-9" value={form.propPaterno} onChange={(e) => set({ propPaterno: e.target.value })} />
          </Field>
          <Field label="Apellido materno">
            <Input className="h-9" value={form.propMaterno} onChange={(e) => set({ propMaterno: e.target.value })} />
          </Field>
          <Field label="Nombre(s)" required>
            <Input className="h-9" value={form.propNombre} onChange={(e) => set({ propNombre: e.target.value })} />
          </Field>
        </div>
      )}

      {form.propTipoPersona && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="RFC">
              <Input className="h-9 font-mono text-xs" placeholder="XXXX000000XX0" value={form.propRfc} onChange={(e) => set({ propRfc: e.target.value.toUpperCase() })} maxLength={13} />
            </Field>
            <Field label="Correo electrónico" required>
              <Input className="h-9" type="email" value={form.propCorreo} onChange={(e) => set({ propCorreo: e.target.value })} />
            </Field>
            <Field label="Teléfono" required>
              <Input className="h-9" type="tel" value={form.propTelefono} onChange={(e) => set({ propTelefono: e.target.value })} />
            </Field>
          </div>

          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domicilio del propietario</p>
          <DomicilioPickerForm value={form.propDir} onChange={(v) => set({ propDir: v })} />
          <div className="grid grid-cols-4 gap-4">
            <Field label="Manzana">
              <Input className="h-9" value={form.propManzana} onChange={(e) => set({ propManzana: e.target.value })} />
            </Field>
            <Field label="Lote">
              <Input className="h-9" value={form.propLote} onChange={(e) => set({ propLote: e.target.value })} />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}

function StepSolicitud({ form, set }: { form: SolicitudState; set: (p: Partial<SolicitudState>) => void }) {
  const resetCondo = {
    condoViviendas: '', condoUbicacionTomas: '' as const, condoTieneMedidorMacro: '' as const,
    condoNumMedidor: '', condoAreasComunes: '' as const, condoNumAreas: '',
    condoAgrupacion: '' as const, condoNombreAgrupacion: '', personasVivienda: '',
  };
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">1. ¿Uso que desea contratar? <span className="text-destructive">*</span></p>
        <PillToggle
          idPrefix="uso"
          options={[
            { value: 'si', label: 'Doméstico' },
            { value: 'no', label: 'No Doméstico', sub: '(comercial, industrial, otros)' },
          ]}
          value={form.usoDomestico}
          onChange={(v) => set({ usoDomestico: v as 'si' | 'no', hayInfraCEA: '', esCondominio: '', ...resetCondo })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          2. ¿En el predio hay instalaciones de tuberías para conectar toma(s) y colocar medidor(es)? <span className="text-destructive">*</span>
        </p>
        <YesNo id="hay-tuberias" value={form.hayTuberias} onChange={(v) => set({ hayTuberias: v })} />
      </div>

      {form.usoDomestico === 'si' && (
        <div className="space-y-5 rounded-lg border bg-muted/20 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Uso doméstico</p>

          <div className="space-y-2">
            <p className="text-sm font-medium">1. ¿En la colonia o desarrollo existe infraestructura de agua operada por la CEA?</p>
            <YesNo id="hay-infra-cea" value={form.hayInfraCEA} onChange={(v) => set({ hayInfraCEA: v })} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">2. La colonia o desarrollo ¿es un condominio?</p>
            <YesNo id="es-condominio" value={form.esCondominio} onChange={(v) => set({ esCondominio: v, ...resetCondo })} />

            {form.esCondominio === 'si' && (
              <div className="ml-4 mt-3 space-y-4 border-l border-muted-foreground/20 pl-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">a. ¿Cuántas viviendas / unidades privativas se desea contratar? <span className="text-xs text-muted-foreground">(Trámite individualización)</span></Label>
                  <Input className="h-9 max-w-xs" type="number" min="1" placeholder="Núm. unidades" value={form.condoViviendas} onChange={(e) => set({ condoViviendas: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <p className="text-sm">a.1 ¿Dónde se encuentran ubicadas las tomas?</p>
                  <PillToggle
                    idPrefix="tomas"
                    options={[{ value: 'banqueta', label: 'En la banqueta' }, { value: 'cuadro', label: 'Hay cuadro para instalar medidor' }]}
                    value={form.condoUbicacionTomas}
                    onChange={(v) => set({ condoUbicacionTomas: v as 'banqueta' | 'cuadro' })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm">b. ¿El condominio cuenta actualmente con medidor (macro)?</p>
                  <YesNo id="condo-medidor" value={form.condoTieneMedidorMacro} onChange={(v) => set({ condoTieneMedidorMacro: v, condoNumMedidor: '' })} />
                  {form.condoTieneMedidorMacro === 'si' && (
                    <Input className="mt-1.5 h-9 max-w-xs" placeholder="Número de medidor" value={form.condoNumMedidor} onChange={(e) => set({ condoNumMedidor: e.target.value })} />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm">c. ¿Se pretende contratar servicio para áreas comunes? <span className="text-xs text-muted-foreground">(Excepto áreas verdes)</span></p>
                  <YesNo id="condo-areas" value={form.condoAreasComunes} onChange={(v) => set({ condoAreasComunes: v, condoNumAreas: '' })} />
                  {form.condoAreasComunes === 'si' && (
                    <Input className="mt-1.5 h-9 max-w-xs" type="number" min="1" placeholder="¿Cuántas áreas?" value={form.condoNumAreas} onChange={(e) => set({ condoNumAreas: e.target.value })} />
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm">d. ¿Existe una agrupación formal de colonos o condominios? <span className="text-destructive">*</span></p>
                  <YesNo id="condo-agrupacion" value={form.condoAgrupacion} onChange={(v) => set({ condoAgrupacion: v, condoNombreAgrupacion: '' })} />
                  {form.condoAgrupacion === 'si' && (
                    <Input className="mt-1.5 h-9 max-w-sm" placeholder="Nombre de la agrupación" value={form.condoNombreAgrupacion} onChange={(e) => set({ condoNombreAgrupacion: e.target.value })} />
                  )}
                </div>
              </div>
            )}

            {form.esCondominio === 'no' && (
              <div className="ml-4 mt-3 space-y-1.5 border-l border-muted-foreground/20 pl-4">
                <Label className="text-sm">a. ¿Cuántas personas habitarán la vivienda?</Label>
                <Input className="h-9 max-w-xs" type="number" min="1" placeholder="Núm. personas" value={form.personasVivienda} onChange={(e) => set({ personasVivienda: e.target.value })} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              3. ¿Cuenta con certificado de conexión?{' '}
              <span className="font-normal text-muted-foreground text-xs">(Documento que avala infraestructura entregada a la CEA y/o municipio)</span>
            </p>
            <YesNo id="cert-conexion" value={form.tieneCertConexion} onChange={(v) => set({ tieneCertConexion: v })} />
          </div>
        </div>
      )}

      {form.usoDomestico === 'no' && (
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          Para uso no doméstico continúe con las siguientes secciones.
        </div>
      )}
    </div>
  );
}

function StepContratacion({ form, set }: { form: SolicitudState; set: (p: Partial<SolicitudState>) => void }) {
  const tiposList = form.adminId ? (TIPOS_CONTRATACION_BY_ADMIN[form.adminId] ?? []) : [];
  const selectedTipo = tiposList.find((t) => t.id === form.tipoContratacionId);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Administración" required>
          <Select value={form.adminId} onValueChange={(v) => set({ adminId: v, tipoContratacionId: '' })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione administración…" /></SelectTrigger>
            <SelectContent>
              {Object.entries(ADMINISTRACIONES).map(([id, nombre]) => (
                <SelectItem key={id} value={id}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tipo de contratación" required>
          <Select
            value={form.tipoContratacionId}
            onValueChange={(v) => set({ tipoContratacionId: v })}
            disabled={!form.adminId || tiposList.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={form.adminId ? 'Seleccione tipo…' : 'Primero seleccione administración'} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {tiposList.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.descripcion}
                  <span className="ml-1.5 font-mono text-xs text-muted-foreground">({t.id})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Contrato padre (solo individualizaciones)">
        <Input className="h-9" placeholder="Folio o número de contrato padre" value={form.contratoPadre} onChange={(e) => set({ contratoPadre: e.target.value })} />
      </Field>

      {selectedTipo && (
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
          <span className="font-medium">{selectedTipo.descripcion}</span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">({selectedTipo.id})</span>
        </div>
      )}
    </div>
  );
}

function StepFiscal({
  form,
  set,
  onCopiarProp,
}: {
  form: SolicitudState;
  set: (p: Partial<SolicitudState>) => void;
  onCopiarProp: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">¿Requiere facturar? <span className="text-destructive">*</span></p>
        <YesNo id="requiere-factura" value={form.requiereFactura} onChange={(v) => set({ requiereFactura: v, mismosDatosProp: '' })} />
      </div>

      {form.requiereFactura === 'si' && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              ¿La factura y dirección fiscal serán los mismos que los del propietario?{' '}
              <span className="text-xs font-normal text-muted-foreground">(Sección B)</span>
            </p>
            <div className="flex items-center gap-3">
              <YesNo
                id="mismos-datos-prop"
                value={form.mismosDatosProp}
                onChange={(v) => {
                  set({ mismosDatosProp: v });
                  if (v === 'si') onCopiarProp();
                }}
              />
              {form.mismosDatosProp === 'no' && (
                <Button type="button" variant="outline" size="sm" onClick={onCopiarProp}>
                  Copiar datos del propietario
                </Button>
              )}
            </div>
          </div>

          {form.mismosDatosProp === 'no' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de persona <span className="text-destructive">*</span></Label>
                <PillToggle
                  idPrefix="fiscal-tipo"
                  options={[{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]}
                  value={form.fiscalTipoPersona}
                  onChange={(v) => set({ fiscalTipoPersona: v as 'fisica' | 'moral' })}
                />
              </div>

              {form.fiscalTipoPersona === 'moral' && (
                <Field label="Razón social" required>
                  <Input className="h-9" value={form.fiscalRazonSocial} onChange={(e) => set({ fiscalRazonSocial: e.target.value })} />
                </Field>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="RFC para facturación" required>
                  <Input className="h-9 font-mono text-xs" placeholder="XXXX000000XX0" value={form.fiscalRfc} onChange={(e) => set({ fiscalRfc: e.target.value.toUpperCase() })} maxLength={13} />
                </Field>
                <Field label="Correo electrónico" required>
                  <Input className="h-9" type="email" value={form.fiscalCorreo} onChange={(e) => set({ fiscalCorreo: e.target.value })} />
                </Field>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domicilio fiscal</p>
              <DomicilioPickerForm value={form.fiscalDir} onChange={(v) => set({ fiscalDir: v })} />
            </div>
          )}

          {(form.mismosDatosProp === 'si' || form.mismosDatosProp === 'no') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Régimen fiscal" required>
                <Select value={form.fiscalRegimenFiscal} onValueChange={(v) => set({ fiscalRegimenFiscal: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione régimen…" /></SelectTrigger>
                  <SelectContent>
                    {REGIMENES_FISCALES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                        <span className="ml-2">{r.nombre}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Uso del CFDI" required>
                <Select value={form.fiscalUsoCfdi} onValueChange={(v) => set({ fiscalUsoCfdi: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Seleccione uso…" /></SelectTrigger>
                  <SelectContent>
                    {USOS_CFDI.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="font-mono text-xs text-muted-foreground">{u.id}</span>
                        <span className="ml-2">{u.nombre}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}
        </>
      )}

      {form.requiereFactura === 'no' && (
        <div className="rounded-md border border-dashed bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          No se generará factura para esta solicitud.
        </div>
      )}
    </div>
  );
}

function ResumenRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StepResumen({ form }: { form: SolicitudState }) {
  const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const tiposList = form.adminId ? (TIPOS_CONTRATACION_BY_ADMIN[form.adminId] ?? []) : [];
  const selectedTipo = tiposList.find((t) => t.id === form.tipoContratacionId);
  const nombre = form.propTipoPersona === 'moral'
    ? form.propRazonSocial
    : [form.propPaterno, form.propMaterno, form.propNombre].filter(Boolean).join(' ');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold">Revise los datos antes de guardar</p>
          <p className="text-sm text-muted-foreground">Al guardar, la solicitud quedará registrada y podrá editarse después.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Predio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pb-4">
            <ResumenRow label="Fecha de solicitud" value={today} />
            <ResumenRow label="Clave catastral" value={form.claveCatastral || '—'} />
            <ResumenRow label="Calle" value={form.predioDir.calle || '—'} />
            <ResumenRow label="Núm. exterior" value={form.predioDir.numExterior} />
            <ResumenRow label="Código postal" value={form.predioDir.codigoPostal} />
            {form.predioManzana && <ResumenRow label="Manzana" value={form.predioManzana} />}
            {form.predioLote && <ResumenRow label="Lote" value={form.predioLote} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Propietario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pb-4">
            <ResumenRow label="Tipo de persona" value={form.propTipoPersona === 'fisica' ? 'Persona física' : form.propTipoPersona === 'moral' ? 'Persona moral' : '—'} />
            <ResumenRow label="Nombre / Razón social" value={nombre || '—'} />
            <ResumenRow label="RFC" value={form.propRfc} />
            <ResumenRow label="Teléfono" value={form.propTelefono} />
            <ResumenRow label="Correo" value={form.propCorreo} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tipo de solicitud</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pb-4">
            <ResumenRow label="Uso" value={form.usoDomestico === 'si' ? 'Doméstico' : form.usoDomestico === 'no' ? 'No doméstico' : '—'} />
            <ResumenRow label="Hay tuberías" value={form.hayTuberias === 'si' ? 'Sí' : form.hayTuberias === 'no' ? 'No' : '—'} />
            {form.usoDomestico === 'si' && (
              <>
                <ResumenRow label="Infraestructura CEA" value={form.hayInfraCEA === 'si' ? 'Sí' : form.hayInfraCEA === 'no' ? 'No' : '—'} />
                <ResumenRow label="Es condominio" value={form.esCondominio === 'si' ? 'Sí' : form.esCondominio === 'no' ? 'No' : '—'} />
                {form.esCondominio === 'no' && form.personasVivienda && (
                  <ResumenRow label="Personas en vivienda" value={form.personasVivienda} />
                )}
                <ResumenRow label="Cert. de conexión" value={form.tieneCertConexion === 'si' ? 'Sí' : form.tieneCertConexion === 'no' ? 'No' : '—'} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contratación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pb-4">
            <ResumenRow label="Administración" value={form.adminId ? ADMINISTRACIONES[form.adminId] : '—'} />
            <ResumenRow label="Tipo de contratación" value={selectedTipo ? `${selectedTipo.descripcion} (${selectedTipo.id})` : '—'} />
            {form.contratoPadre && <ResumenRow label="Contrato padre" value={form.contratoPadre} />}
            <ResumenRow label="Requiere factura" value={form.requiereFactura === 'si' ? 'Sí' : form.requiereFactura === 'no' ? 'No' : '—'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function SolicitudServicio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const store = useSolicitudesStore();

  const isEditMode = !!id;
  const existingRecord = isEditMode ? store.getById(id) : undefined;

  const [form, setForm] = useState<SolicitudState>(existingRecord?.formData ?? SOLICITUD_STATE_EMPTY);
  const [currentStep, setCurrentStep] = useState(0);

  function set(patch: Partial<SolicitudState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function copiarDatosPropietario() {
    set({
      fiscalTipoPersona: form.propTipoPersona,
      fiscalRazonSocial: form.propRazonSocial,
      fiscalRfc: form.propRfc,
      fiscalCorreo: form.propCorreo,
      fiscalDir: { ...form.propDir },
    });
  }

  const isLastStep = currentStep === STEPS.length - 1;
  const canNext = canAdvance(currentStep, form);

  function handlePrellenar() {
    const tipos = TIPOS_CONTRATACION_BY_ADMIN['1'] ?? [];
    const tipoId = tipos[0]?.id ?? '';
    const stepData = MOCK_STEP_DATA[currentStep];
    if (!stepData) return;
    const patch = currentStep === 3
      ? { ...stepData, tipoContratacionId: tipoId }
      : stepData;
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function handleNext() {
    if (!canNext) return;
    if (isLastStep) {
      handleGuardar();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleGuardar() {
    if (isEditMode && id) {
      store.updateFormData(id, form);
      toast.success('Solicitud actualizada');
    } else {
      const record = store.create(form);
      toast.success(`Solicitud ${record.folio} guardada`);
    }
    navigate('/app/solicitudes');
  }

  const stepContent: Record<StepKey, React.ReactNode> = {
    predio: <StepPredio form={form} set={set} />,
    propietario: <StepPropietario form={form} set={set} />,
    solicitud: <StepSolicitud form={form} set={set} />,
    contratacion: <StepContratacion form={form} set={set} />,
    fiscal: <StepFiscal form={form} set={set} onCopiarProp={copiarDatosPropietario} />,
    resumen: <StepResumen form={form} />,
  };

  const currentStepKey = STEPS[currentStep].key;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/app/solicitudes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              {isEditMode && existingRecord
                ? `Editar solicitud — ${existingRecord.folio}`
                : 'CEA-FUS01 — Nueva Solicitud de Servicios'}
            </h1>
            <p className="text-xs text-muted-foreground">Los campos con * son obligatorios.</p>
          </div>
        </div>
        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
            onClick={handlePrellenar}
          >
            <Wand2 className="h-3.5 w-3.5" />
            Prellenar demo
          </Button>
        )}
      </div>

      {/* ── Step progress ─────────────────────────────────────────────── */}
      <nav aria-label="Pasos de la solicitud" className="w-full overflow-x-auto pb-1">
        <ol className="flex min-w-[560px] items-center sm:min-w-0">
          {STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const segDone = i < currentStep;
            const Icon = step.icon;
            return (
              <React.Fragment key={step.key}>
                <li className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={!done && !active}
                    onClick={() => { if (done) setCurrentStep(i); }}
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      done && 'border-emerald-600 bg-emerald-600 text-white cursor-pointer',
                      active && !done && 'border-primary bg-primary text-primary-foreground',
                      !active && !done && 'border-muted-foreground/30 bg-muted text-muted-foreground',
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                  </button>
                  <span className={cn(
                    'hidden max-w-[5rem] truncate text-center text-[10px] leading-tight sm:block',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}>
                    {step.label}
                  </span>
                </li>
                {i < STEPS.length - 1 && (
                  <div className={cn('mx-1 h-0.5 min-w-[12px] flex-1 transition-colors', segDone ? 'bg-emerald-600' : 'bg-border')} aria-hidden />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {/* ── Step content ──────────────────────────────────────────────── */}
      <div className="min-h-[260px] rounded-lg border bg-card p-5 shadow-sm">
        {stepContent[currentStepKey]}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={() => navigate('/app/solicitudes')}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canNext}
            className={isLastStep ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-[#007BFF] hover:bg-blue-600 text-white'}
          >
            {isLastStep ? (isEditMode ? 'Guardar cambios' : 'Guardar solicitud') : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
}
