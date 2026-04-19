import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSolicitud, fetchSolicitud, updateSolicitud } from '@/api/solicitudes';
import type { CatalogoEstadoINEGI, CatalogoMunicipioINEGIRow, PaginatedInegi } from '@/api/domicilios-inegi';
import { fetchInegiEstados, fetchInegiMunicipiosCatalogo, fetchInegiLocalidadesCatalogo, fetchInegiColoniasCatalogo } from '@/api/domicilios-inegi';
import { ArrowLeft, FileText, Wand2 } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import DomicilioPickerForm from '@/components/contratacion/DomicilioPickerForm';
import { fetchAdministraciones, fetchDistritos, fetchGruposActividad, fetchActividades, type DistritoCatalogo, type CatalogoGrupoActividad, type CatalogoActividad } from '@/api/catalogos';
import { fetchTiposContratacion, fetchTipoContratacionConfiguracion, type TipoContratacion } from '@/api/tipos-contratacion';
import { hasApi } from '@/api/contratos';
import { cn } from '@/lib/utils';
import type { DomicilioFormValue, SolicitudEstado, SolicitudRecord, SolicitudState } from '@/types/solicitudes';
import { SOLICITUD_STATE_EMPTY } from '@/types/solicitudes';
import { deriveName, derivePredioResumen, useSolicitudesStore } from '@/hooks/useSolicitudesStore';

// ── Catalogues ───────────────────────────────────────────────────────────────

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

const MOCK_DATA: SolicitudState = {
  claveCatastral: '22001-045-012',
  folioExpediente: '',
  predioDir: {
    estadoINEGIId: '22',        // Querétaro
    municipioINEGIId: '22001',  // Querétaro (capital) — clave INEGI en catálogo sembrado
    localidadINEGIId: '',
    coloniaINEGIId: '',
    codigoPostal: '76030',
    calle: 'Av. Constituyentes',
    numExterior: '425',
    numInterior: 'Depto. 3',
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
    municipioINEGIId: '22001',
    localidadINEGIId: '',
    coloniaINEGIId: '',
    codigoPostal: '76030',
    calle: 'Calle Independencia',
    numExterior: '88',
    numInterior: 'Int. 3',
    referencia: 'Entre Av. 5 de Febrero y calle Hidalgo',
  },
  propManzana: '12',
  propLote: '04',
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
  adminId: '',
  tipoContratacionId: '',
  contratoPadre: '',
  requiereFactura: 'si',
  mismosDatosProp: 'si',
  fiscalTipoPersona: 'fisica',
  fiscalRazonSocial: '',
  fiscalRfc: 'GARM850312AB3',
  fiscalCorreo: 'mgarcia@correo.com',
  fiscalDir: {
    estadoINEGIId: '22',
    municipioINEGIId: '22001',
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
  generarOrdenInspeccion: true,
};

// ── Validación CEAFUS01 (envío) ───────────────────────────────────────────────

function validDir(d: {
  estadoINEGIId: string;
  municipioINEGIId: string;
  localidadINEGIId: string;
  coloniaINEGIId: string;
  calle: string;
  numExterior: string;
}) {
  return !!(
    d.estadoINEGIId &&
    d.municipioINEGIId &&
    d.localidadINEGIId &&
    d.coloniaINEGIId &&
    d.calle.trim() &&
    d.numExterior.trim()
  );
}

/** Catálogo obligatorio: no aceptar placeholder de preset (`__first__`). */
function catalogoSeleccionValido(id: string | undefined): boolean {
  const t = id?.trim();
  return !!t && t !== '__first__';
}

/** Mensajes en español para toast / accesibilidad */
function validateCeafus01(form: SolicitudState): string[] {
  const e: string[] = [];
  if (!validDir(form.predioDir)) {
    e.push('Complete el domicilio del predio (INEGI: estado, municipio, localidad, colonia, calle y número exterior).');
  }
  if (!form.propTipoPersona) e.push('Seleccione el tipo de persona del propietario.');
  if (form.propTipoPersona === 'moral' && !form.propRazonSocial.trim()) e.push('Indique la razón social del propietario.');
  if (form.propTipoPersona === 'fisica' && (!form.propPaterno.trim() || !form.propNombre.trim())) {
    e.push('Indique apellido paterno y nombre del propietario.');
  }
  if (!form.propCorreo.trim()) e.push('Correo electrónico del propietario.');
  if (!form.propTelefono.trim()) e.push('Teléfono del propietario.');
  if (!validDir(form.propDir)) e.push('Complete el domicilio del propietario.');
  if (!form.requiereFactura) e.push('Indique si requiere facturar.');
  if (form.requiereFactura === 'si') {
    if (!form.mismosDatosProp) e.push('Indique si la factura usará los mismos datos que el propietario.');
    if (form.mismosDatosProp === 'si' || form.mismosDatosProp === 'no') {
      if (!form.fiscalTipoPersona) e.push('Tipo de persona para facturación.');
      if (form.fiscalTipoPersona === 'moral' && !form.fiscalRazonSocial.trim()) e.push('Razón social para facturación.');
      if (!form.fiscalRfc.trim()) e.push('RFC para facturación.');
      if (!form.fiscalCorreo.trim()) e.push('Correo para facturación.');
      if (!validDir(form.fiscalDir)) e.push('Complete el domicilio fiscal.');
      if (!form.fiscalRegimenFiscal || !form.fiscalUsoCfdi) e.push('Régimen fiscal y uso del CFDI.');
    }
  }
  if (!form.usoDomestico || !form.hayTuberias) {
    e.push('Responda el tipo de uso del servicio y si hay instalaciones de tuberías en el predio.');
  }
  if (form.usoDomestico === 'no' && !form.noDomHayInfra) {
    e.push('Indique si cuenta con infraestructura para tomas (uso no doméstico).');
  }
  if (form.usoDomestico === 'si' && form.esCondominio === 'si') {
    if (form.condoAreasComunes === 'si') {
      const n = parseInt(form.condoNumAreas, 10);
      if (!form.condoNumAreas.trim() || !Number.isFinite(n) || n < 1) {
        e.push('Indique cuántas áreas comunes (número válido).');
      }
    }
    if (form.condoAgrupacion === 'si' && !form.condoNombreAgrupacion.trim()) {
      e.push('Indique el nombre de la agrupación formal.');
    }
  }
  if (!form.adminId || !form.tipoContratacionId) {
    e.push('Seleccione administración y tipo de contratación.');
  }
  if (!catalogoSeleccionValido(form.distritoId)) e.push('Seleccione distrito.');
  if (!catalogoSeleccionValido(form.grupoActividadId)) e.push('Seleccione grupo de actividad.');
  if (!catalogoSeleccionValido(form.actividadId)) e.push('Seleccione actividad.');
  return e;
}

function FormSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <h2 className="border-b border-primary/25 pb-2 text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
      {children}
    </section>
  );
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
  disabled = false,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
  idPrefix: string;
  disabled?: boolean;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <Label
          key={opt.value}
          htmlFor={`${idPrefix}-${i}`}
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-4 py-1.5 text-sm font-medium transition-colors select-none',
            disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
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
          onChange={(v) => {
            const next = v as 'si' | 'no';
            set({
              usoDomestico: next,
              hayInfraCEA: '',
              esCondominio: '',
              ...resetCondo,
              ...(next === 'si' ? CLEAR_ALL_NO_DOM : {}),
            });
          }}
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
                  <p className="text-sm">
                    c. ¿Se pretende contratar servicio para áreas comunes?{' '}
                    <span className="text-xs text-muted-foreground">(Excepto áreas verdes)</span>
                  </p>
                  <YesNo id="condo-areas" value={form.condoAreasComunes} onChange={(v) => set({ condoAreasComunes: v, condoNumAreas: '' })} />
                  {form.condoAreasComunes === 'si' && (
                    <div className="mt-1.5 max-w-xs">
                      <Field label="¿Cuántas áreas?" required>
                        <Input
                          className="h-9"
                          type="number"
                          min="1"
                          placeholder="Número de áreas"
                          value={form.condoNumAreas}
                          onChange={(e) => set({ condoNumAreas: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm">d. ¿Existe una agrupación formal de colonos o condominios?</p>
                  <YesNo id="condo-agrupacion" value={form.condoAgrupacion} onChange={(v) => set({ condoAgrupacion: v, condoNombreAgrupacion: '' })} />
                  {form.condoAgrupacion === 'si' && (
                    <div className="mt-1.5 max-w-sm">
                      <Field label="Nombre de la agrupación" required>
                        <Input
                          className="h-9"
                          placeholder="Nombre de la agrupación"
                          value={form.condoNombreAgrupacion}
                          onChange={(e) => set({ condoNombreAgrupacion: e.target.value })}
                        />
                      </Field>
                    </div>
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
        <div className="space-y-5 rounded-lg border bg-muted/20 p-4">
          <p className="text-lg font-bold text-primary uppercase tracking-wide">Uso No Doméstico</p>
          <p className="text-sm text-muted-foreground">Llenar todos los campos que correspondan.</p>
          <p className="text-xs text-muted-foreground">(Usos mixtos pueden ser: doméstico+comercio, industria+comercio u otros similares de modo que se llenen los campos específicos).</p>

          <div className="space-y-2">
            <p className="text-sm font-medium">¿Cuenta con infraestructura para toma/s y otros servicios de agua? <span className="text-destructive">*</span></p>
            <YesNo
              id="no-dom-hay-infra"
              value={form.noDomHayInfra}
              onChange={(v) =>
                set({
                  noDomHayInfra: v,
                  ...(v === 'si' ? CLEAR_NO_DOM_REQ : CLEAR_NO_DOM_GIROS),
                })
              }
            />
          </div>

          {/* CON infraestructura → giros específicos */}
          {form.noDomHayInfra === 'si' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Seleccione el giro específico y llene los campos</p>

              {/* Restaurante */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-3">
                <span className="text-sm font-semibold">RESTAURANTE</span>
                <Field label="Núm. comensales por día">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomRestComensales} onChange={(e) => set({ noDomRestComensales: e.target.value })} />
                </Field>
                <Field label="Núm. de mesas">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomRestMesas} onChange={(e) => set({ noDomRestMesas: e.target.value })} />
                </Field>
                <Field label="Núm. de sanitarios">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomRestSanitarios} onChange={(e) => set({ noDomRestSanitarios: e.target.value })} />
                </Field>
              </div>

              {/* Lavandería */}
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-3">
                <span className="text-sm font-semibold">LAVANDERÍA</span>
                <Field label="Núm. de lavadoras">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomLavNumLavadoras} onChange={(e) => set({ noDomLavNumLavadoras: e.target.value })} />
                </Field>
                <Field label="Capacidad Kg por lavadora">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomLavCapKg} onChange={(e) => set({ noDomLavCapKg: e.target.value })} />
                </Field>
                <Field label="Kg de ropa promedio por día">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomLavKgDia} onChange={(e) => set({ noDomLavKgDia: e.target.value })} />
                </Field>
              </div>

              {/* Autolavado */}
              <div className="grid grid-cols-[120px_1fr_3fr] items-center gap-3">
                <span className="text-sm font-semibold">AUTOLAVADO</span>
                <Field label="Núm. automóviles lavados por día">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomAutoAutosDia} onChange={(e) => set({ noDomAutoAutosDia: e.target.value })} />
                </Field>
              </div>

              {/* Tortillería */}
              <div className="grid grid-cols-[120px_1fr_3fr] items-center gap-3">
                <span className="text-sm font-semibold">TORTILLERÍA</span>
                <Field label="Núm. kg procesados por día">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomTortKgDia} onChange={(e) => set({ noDomTortKgDia: e.target.value })} />
                </Field>
              </div>

              {/* Oficinas */}
              <div className="grid grid-cols-[120px_1fr_1fr_2fr] items-center gap-3">
                <span className="text-sm font-semibold">OFICINAS</span>
                <Field label="M² de oficina/s">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomOficM2Oficinas} onChange={(e) => set({ noDomOficM2Oficinas: e.target.value })} />
                </Field>
                <Field label="M² de estacionamiento">
                  <Input className="h-9" type="number" min="0" placeholder="0" value={form.noDomOficM2Estac} onChange={(e) => set({ noDomOficM2Estac: e.target.value })} />
                </Field>
              </div>

              {/* Otro giro */}
              <div className="grid grid-cols-[120px_1fr] items-center gap-3">
                <span className="text-sm font-semibold">OTRO GIRO</span>
                <Field label="Especificar">
                  <Input className="h-9" placeholder="Descripción del giro" value={form.noDomOtroGiro} onChange={(e) => set({ noDomOtroGiro: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          {/* SIN infraestructura → requerimiento de agua */}
          {form.noDomHayInfra === 'no' && (
            <div className="space-y-4">
              <p className="text-base font-bold text-primary uppercase tracking-wide">Requerimiento de Agua</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-semibold w-40">USO</th>
                      <th className="py-2 text-left font-semibold">UNIDADES (Especificar núm. de tomas)</th>
                      <th className="py-2 text-left font-semibold">GIRO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {([
                      { label: 'DOMÉSTICO',  uKey: 'noDomReqDomUnidades', gKey: 'noDomReqDomGiro' },
                      { label: 'COMERCIAL',  uKey: 'noDomReqComUnidades', gKey: 'noDomReqComGiro' },
                      { label: 'INDUSTRIAL', uKey: 'noDomReqIndUnidades', gKey: 'noDomReqIndGiro' },
                      { label: 'OTRO (Especificar)', uKey: 'noDomReqOtroUnidades', gKey: 'noDomReqOtroGiro' },
                    ] as { label: string; uKey: keyof SolicitudState; gKey: keyof SolicitudState }[]).map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 font-semibold pr-4">{row.label}</td>
                        <td className="py-2 pr-4">
                          <Input className="h-8 max-w-[120px]" type="number" min="0" placeholder="0"
                            value={form[row.uKey] as string}
                            onChange={(e) => set({ [row.uKey]: e.target.value } as Partial<SolicitudState>)} />
                        </td>
                        <td className="py-2">
                          <Input className="h-8" placeholder="—"
                            value={form[row.gKey] as string}
                            onChange={(e) => set({ [row.gKey]: e.target.value } as Partial<SolicitudState>)} />
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="py-2 pr-4">TOTAL DE UNIDADES A SERVIR</td>
                      <td className="py-2">
                        <Input className="h-8 max-w-[120px]" type="number" min="0" placeholder="0"
                          value={form.noDomReqTotalUnidades}
                          onChange={(e) => set({ noDomReqTotalUnidades: e.target.value })} />
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepContratacion({ form, set }: { form: SolicitudState; set: (p: Partial<SolicitudState>) => void }) {
  const useApi = hasApi();
  const { data: administraciones = [], isLoading: adminsLoading, isError: adminsError } = useQuery({
    queryKey: ['catalogos-operativos', 'administraciones'],
    queryFn: fetchAdministraciones,
    enabled: useApi,
    staleTime: 60 * 60 * 1000,
  });

  const { data: tiposRes, isLoading: tiposLoading, isError: tiposError } = useQuery({
    queryKey: ['tipos-contratacion', form.adminId, 'solicitud-servicio'],
    queryFn: () =>
      fetchTiposContratacion({
        administracionId: form.adminId,
        activo: true,
        page: 1,
        limit: 200,
      }),
    enabled: useApi && !!form.adminId,
  });

  const { data: distritos = [], isLoading: distritosLoading } = useQuery({
    queryKey: ['catalogos', 'distritos'],
    queryFn: fetchDistritos,
    enabled: useApi,
    staleTime: 60 * 60 * 1000,
  });

  const { data: grupos = [], isLoading: gruposLoading } = useQuery({
    queryKey: ['catalogos', 'grupos-actividad'],
    queryFn: fetchGruposActividad,
    enabled: useApi,
    staleTime: 60 * 60 * 1000,
  });

  const { data: actividades = [], isLoading: actividadesLoading } = useQuery({
    queryKey: ['catalogos', 'actividades'],
    queryFn: fetchActividades,
    enabled: useApi,
    staleTime: 60 * 60 * 1000,
  });

  const actividadesFiltradas: CatalogoActividad[] = form.grupoActividadId
    ? actividades.filter((a) => a.grupoId === form.grupoActividadId)
    : actividades;

  const tiposList: TipoContratacion[] = tiposRes?.data ?? [];
  const selectedTipo = tiposList.find((t) => t.id === form.tipoContratacionId);

  const { data: tipoConfig, isLoading: configLoading } = useQuery({
    queryKey: ['tipo-contratacion-config', form.tipoContratacionId],
    queryFn: () => fetchTipoContratacionConfiguracion(form.tipoContratacionId),
    enabled: useApi && !!form.tipoContratacionId,
    staleTime: 10 * 60 * 1000,
  });

  const variables = tipoConfig?.variables ?? [];
  const documentos = tipoConfig?.documentos ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Administración" required>
          <Select
            value={form.adminId}
            onValueChange={(v) =>
              set({
                adminId: v,
                tipoContratacionId: '',
                distritoId: '',
                grupoActividadId: '',
                actividadId: '',
              })
            }
            disabled={!useApi || adminsLoading || administraciones.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue
                placeholder={
                  !useApi
                    ? 'Catálogo no disponible'
                    : adminsLoading
                      ? 'Cargando…'
                      : adminsError
                        ? 'Error al cargar'
                        : 'Seleccione administración…'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {administraciones.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tipo de contratación" required>
          <Select
            value={form.tipoContratacionId}
            onValueChange={(v) => set({ tipoContratacionId: v })}
            disabled={!form.adminId || tiposLoading || tiposList.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue
                placeholder={
                  !form.adminId
                    ? 'Primero seleccione administración'
                    : tiposLoading
                      ? 'Cargando tipos…'
                      : tiposError
                        ? 'Error al cargar tipos'
                        : tiposList.length === 0
                          ? 'Sin tipos para esta administración'
                          : 'Seleccione tipo…'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {tiposList.map((t) => {
                const label = t.descripcion?.trim() || t.nombre;
                return (
                  <SelectItem key={t.id} value={t.id}>
                    {label}
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">({t.codigo})</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Contrato padre (solo individualizaciones)">
        <Input className="h-9" placeholder="Folio o número de contrato padre" value={form.contratoPadre} onChange={(e) => set({ contratoPadre: e.target.value })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Distrito" required>
          <Select
            value={form.distritoId}
            onValueChange={(v) => set({ distritoId: v })}
            disabled={!useApi || distritosLoading || distritos.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={distritosLoading ? 'Cargando…' : 'Seleccione distrito…'} />
            </SelectTrigger>
            <SelectContent>
              {distritos.map((d: DistritoCatalogo) => (
                <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Grupo actividad" required>
          <Select
            value={form.grupoActividadId}
            onValueChange={(v) => set({ grupoActividadId: v, actividadId: '' })}
            disabled={!useApi || gruposLoading || grupos.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={gruposLoading ? 'Cargando…' : 'Seleccione grupo…'} />
            </SelectTrigger>
            <SelectContent>
              {grupos.map((g: CatalogoGrupoActividad) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.codigo} – {g.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Actividad" required>
          <Select
            value={form.actividadId}
            onValueChange={(v) => set({ actividadId: v })}
            disabled={!useApi || actividadesLoading || actividadesFiltradas.length === 0}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={
                !form.grupoActividadId
                  ? 'Primero seleccione grupo'
                  : actividadesLoading
                    ? 'Cargando…'
                    : actividadesFiltradas.length === 0
                      ? 'Sin actividades para este grupo'
                      : 'Seleccione actividad…'
              } />
            </SelectTrigger>
            <SelectContent>
              {actividadesFiltradas.map((a: CatalogoActividad) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.codigo} – {a.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {selectedTipo && (
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
          <span className="font-medium">{selectedTipo.descripcion?.trim() || selectedTipo.nombre}</span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">({selectedTipo.codigo})</span>
        </div>
      )}

      {/* Variables de Contratación */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Variables de Contratación:</p>
        <div className="rounded-md border bg-background p-4">
          {configLoading ? (
            <p className="text-xs text-muted-foreground">Cargando variables…</p>
          ) : variables.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {variables
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((v) => (
                  <Field
                    key={v.id}
                    label={`${v.tipoVariable.nombre}${v.tipoVariable.unidad ? ` (${v.tipoVariable.unidad})` : ''}`}
                    required={v.obligatorio}
                  >
                    <Input
                      className="h-9"
                      placeholder={v.valorDefecto ?? ''}
                      value={(form.variablesCapturadas[v.tipoVariable.codigo] as string) ?? ''}
                      onChange={(e) =>
                        set({
                          variablesCapturadas: {
                            ...form.variablesCapturadas,
                            [v.tipoVariable.codigo]: e.target.value,
                          },
                        })
                      }
                    />
                  </Field>
                ))}
            </div>
          ) : (
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Anota aquí las variables de contratación…"
              value={form.variablesTexto}
              onChange={(e) => set({ variablesTexto: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Documentos Presentados */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Documentos Presentados:</p>
        <div className="rounded-md border bg-background p-4">
          {configLoading ? (
            <p className="text-xs text-muted-foreground">Cargando documentos…</p>
          ) : documentos.length > 0 ? (
            <div className="space-y-2">
              {documentos.map((doc) => {
                const checked = form.documentosRecibidos.includes(doc.id);
                return (
                  <label key={doc.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-primary"
                      checked={checked}
                      onChange={(e) =>
                        set({
                          documentosRecibidos: e.target.checked
                            ? [...form.documentosRecibidos, doc.id]
                            : form.documentosRecibidos.filter((id) => id !== doc.id),
                        })
                      }
                    />
                    <span className={doc.obligatorio ? 'font-medium' : ''}>
                      {doc.nombreDocumento.toUpperCase()}
                      {doc.obligatorio && <span className="ml-1 text-destructive">*</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Lista los documentos presentados…"
              value={form.documentosTexto}
              onChange={(e) => set({ documentosTexto: e.target.value })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepFiscal({
  form,
  set,
}: {
  form: SolicitudState;
  set: (p: Partial<SolicitudState>) => void;
}) {
  const locked = form.mismosDatosProp === 'si';

  function handleMismosDatos(v: 'si' | 'no') {
    if (v === 'si') {
      set({
        mismosDatosProp: 'si',
        fiscalTipoPersona: form.propTipoPersona,
        fiscalRazonSocial: form.propRazonSocial,
        fiscalRfc: form.propRfc,
        fiscalCorreo: form.propCorreo,
        fiscalDir: { ...form.propDir },
      });
    } else {
      set({ mismosDatosProp: 'no' });
    }
  }

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
            <YesNo id="mismos-datos-prop" value={form.mismosDatosProp} onChange={handleMismosDatos} />
          </div>

          {(form.mismosDatosProp === 'si' || form.mismosDatosProp === 'no') && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tipo de persona <span className="text-destructive">*</span>
                  {locked && <span className="ml-2 text-xs font-normal text-muted-foreground">(del propietario)</span>}
                </Label>
                <PillToggle
                  idPrefix="fiscal-tipo"
                  options={[{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]}
                  value={form.fiscalTipoPersona}
                  onChange={locked ? () => {} : (v) => set({ fiscalTipoPersona: v as 'fisica' | 'moral' })}
                  disabled={locked}
                />
              </div>

              {locked && form.fiscalTipoPersona === 'fisica' && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Apellido paterno" required>
                    <Input className="h-9 bg-muted/40" value={form.propPaterno} readOnly disabled />
                  </Field>
                  <Field label="Apellido materno">
                    <Input className="h-9 bg-muted/40" value={form.propMaterno} readOnly disabled />
                  </Field>
                  <Field label="Nombre(s)" required>
                    <Input className="h-9 bg-muted/40" value={form.propNombre} readOnly disabled />
                  </Field>
                </div>
              )}

              {form.fiscalTipoPersona === 'moral' && (
                <Field label="Razón social" required>
                  <Input className="h-9" value={form.fiscalRazonSocial} readOnly={locked} disabled={locked} onChange={(e) => set({ fiscalRazonSocial: e.target.value })} />
                </Field>
              )}

              <div className={cn('grid gap-4', locked ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                <Field label="RFC para facturación" required>
                  <Input className="h-9 font-mono text-xs" placeholder="XXXX000000XX0" value={form.fiscalRfc} readOnly={locked} disabled={locked} onChange={(e) => set({ fiscalRfc: e.target.value.toUpperCase() })} maxLength={13} />
                </Field>
                <Field label="Correo electrónico" required>
                  <Input className="h-9" type="email" value={form.fiscalCorreo} readOnly={locked} disabled={locked} onChange={(e) => set({ fiscalCorreo: e.target.value })} />
                </Field>
                {locked && (
                  <Field label="Teléfono" required>
                    <Input className="h-9 bg-muted/40" type="tel" value={form.propTelefono} readOnly disabled />
                  </Field>
                )}
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Domicilio fiscal
                {locked && <span className="ml-2 font-normal normal-case text-muted-foreground/70">(precargado del propietario)</span>}
              </p>
              <DomicilioPickerForm value={form.fiscalDir} onChange={locked ? () => {} : (v) => set({ fiscalDir: v })} disabled={locked} />

              {locked && (
                <div className="grid grid-cols-4 gap-4">
                  <Field label="Manzana">
                    <Input className="h-9 bg-muted/40" value={form.propManzana} readOnly disabled />
                  </Field>
                  <Field label="Lote">
                    <Input className="h-9 bg-muted/40" value={form.propLote} readOnly disabled />
                  </Field>
                </div>
              )}

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

// ── Formulario CEAFUS01 (una sola vista) ─────────────────────────────────────

export default function SolicitudServicio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const store = useSolicitudesStore();

  const isEditMode = !!id;
  const localRecord = isEditMode && id ? store.getById(id) : undefined;
  const { data: apiSolicitud, isPending: isSolicitudLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn: () => fetchSolicitud(id!),
    enabled: isEditMode && !!id && !localRecord,
    staleTime: 30_000,
  });

  const [form, setForm] = useState<SolicitudState>(localRecord?.formData ?? SOLICITUD_STATE_EMPTY);

  useEffect(() => {
    if (!localRecord && apiSolicitud?.formData) {
      const fd = apiSolicitud.formData as SolicitudState;
      setForm({
        ...fd,
        generarOrdenInspeccion: fd.generarOrdenInspeccion === true,
      });
    }
  }, [localRecord, apiSolicitud?.id, apiSolicitud?.formData]);

  const existingRecord: SolicitudRecord | undefined =
    localRecord ??
    (apiSolicitud
      ? {
          id: apiSolicitud.id,
          folio: apiSolicitud.folio,
          fechaSolicitud: apiSolicitud.fechaSolicitud,
          propNombreCompleto: apiSolicitud.propNombreCompleto,
          propTelefono: apiSolicitud.propTelefono ?? '—',
          predioResumen: apiSolicitud.predioResumen,
          adminId: apiSolicitud.adminId ?? '',
          tipoContratacionId: apiSolicitud.tipoContratacionId ?? '',
          usoDomestico: apiSolicitud.formData.usoDomestico,
          estado: apiSolicitud.estado as SolicitudEstado,
          formData: apiSolicitud.formData as SolicitudState,
          createdAt: apiSolicitud.createdAt,
        }
      : undefined);

  const createMutation = useMutation({
    mutationFn: (dto: Parameters<typeof createSolicitud>[0]) => createSolicitud(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ sid, dto }: { sid: string; dto: Parameters<typeof updateSolicitud>[1] }) =>
      updateSolicitud(sid, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      void queryClient.invalidateQueries({ queryKey: ['solicitud', id] });
    },
  });

  function set(patch: Partial<SolicitudState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function resolveDir(dir: DomicilioFormValue | undefined): Promise<DomicilioFormValue | undefined> {
    if (!dir) return dir;

    // Resolve estado — fetch if not cached yet
    const estados = await queryClient.fetchQuery({
      queryKey: ['inegi-estados'],
      queryFn: fetchInegiEstados,
      staleTime: 10 * 60 * 1000,
    });
    const estado = (estados ?? []).find((e) => e.claveINEGI === dir.estadoINEGIId || e.id === dir.estadoINEGIId);
    const estadoId = estado?.id ?? '';

    if (!estadoId) return { ...dir, estadoINEGIId: '', municipioINEGIId: '', localidadINEGIId: '', coloniaINEGIId: '' };

    // Resolve municipio (fetch if not in cache)
    const mpioRes = await queryClient.fetchQuery({
      queryKey: ['inegi-municipios', estadoId],
      queryFn: () => fetchInegiMunicipiosCatalogo({ estadoId, limit: 200 }),
      staleTime: 10 * 60 * 1000,
    });
    const municipios = mpioRes?.data ?? [];
    // Match UUID, full claveINEGI (ej. "22001"), concatenación estado+municipio de 3 dígitos (ej. "001" → "22001"), o sufijos legacy
    const rawMpio = dir.municipioINEGIId ?? '';
    const estadoClave = estado?.claveINEGI ?? '';
    const munDigits = rawMpio.replace(/\D/g, '');
    const combinedMunClave =
      estadoClave && munDigits.length > 0 && munDigits.length <= 3
        ? `${estadoClave}${munDigits.padStart(3, '0')}`
        : null;
    const mpio =
      municipios.find((m) => m.id === rawMpio) ??
      municipios.find((m) => m.claveINEGI === rawMpio) ??
      (combinedMunClave ? municipios.find((m) => m.claveINEGI === combinedMunClave) : undefined) ??
      municipios.find((m) => m.claveINEGI === rawMpio.slice(-3)) ??
      municipios.find((m) => m.claveINEGI === rawMpio.replace(/^0+/, '')) ??
      municipios[0]; // fallback: first municipio in state (demo only)
    const municipioId = mpio?.id ?? '';

    if (!municipioId) return { ...dir, estadoINEGIId: estadoId, municipioINEGIId: '', localidadINEGIId: '', coloniaINEGIId: '' };

    // Resolve localidad — use provided id or pick first available
    let localidadId = dir.localidadINEGIId;
    if (!localidadId) {
      const locRes = await queryClient.fetchQuery({
        queryKey: ['inegi-localidades', municipioId],
        queryFn: () => fetchInegiLocalidadesCatalogo({ municipioId, limit: 200 }),
        staleTime: 10 * 60 * 1000,
      });
      localidadId = locRes?.data?.[0]?.id ?? '';
    }

    // Resolve colonia — prefer one matching the CP, else first available
    let coloniaId = dir.coloniaINEGIId;
    if (!coloniaId) {
      const colRes = await queryClient.fetchQuery({
        queryKey: ['inegi-colonias', municipioId],
        queryFn: () => fetchInegiColoniasCatalogo({ municipioId, limit: 500 }),
        staleTime: 10 * 60 * 1000,
      });
      const colonias = colRes?.data ?? [];
      const byCP = dir.codigoPostal ? colonias.find((c) => c.codigoPostal === dir.codigoPostal) : null;
      coloniaId = byCP?.id ?? colonias[0]?.id ?? '';
    }

    return { ...dir, estadoINEGIId: estadoId, municipioINEGIId: municipioId, localidadINEGIId: localidadId, coloniaINEGIId: coloniaId };
  }

  async function handlePrellenar() {
    if (!hasApi()) {
      setForm({ ...MOCK_DATA });
      toast.success('Datos de demo cargados');
      return;
    }

    try {
      let next: SolicitudState = { ...MOCK_DATA };

      const administraciones = await queryClient.fetchQuery({
        queryKey: ['catalogos-operativos', 'administraciones'],
        queryFn: fetchAdministraciones,
      });
      if (!administraciones.length) {
        toast.error('No hay administraciones en el catálogo');
        return;
      }
      let chosenAdmin = null as (typeof administraciones)[0] | null;
      let chosenTipo = null as TipoContratacion | null;
      for (const admin of administraciones) {
        const { data: tipos } = await fetchTiposContratacion({
          administracionId: admin.id,
          activo: true,
          page: 1,
          limit: 10,
        });
        const tipo = tipos.find((t) => t.activo) ?? tipos[0];
        if (tipo) {
          chosenAdmin = admin;
          chosenTipo = tipo;
          break;
        }
      }
      if (!chosenAdmin || !chosenTipo) {
        toast.error('No se encontraron tipos de contratación en ninguna administración');
        return;
      }
      const distritos = await queryClient.fetchQuery({
        queryKey: ['catalogos', 'distritos'],
        queryFn: fetchDistritos,
        staleTime: 60 * 60 * 1000,
      });
      const distritoId = distritos?.[0]?.id ?? '';
      const grupos = await queryClient.fetchQuery({
        queryKey: ['catalogos', 'grupos-actividad'],
        queryFn: fetchGruposActividad,
        staleTime: 60 * 60 * 1000,
      });
      const grupo = grupos?.[0];
      const grupoActividadId = grupo?.id ?? '';
      const actividades = await queryClient.fetchQuery({
        queryKey: ['catalogos', 'actividades'],
        queryFn: fetchActividades,
        staleTime: 60 * 60 * 1000,
      });
      const actividadFiltrada = grupoActividadId
        ? (actividades ?? []).find((a) => a.grupoId === grupoActividadId)
        : (actividades ?? [])[0];
      const actividadId = actividadFiltrada?.id ?? '';

      next = {
        ...next,
        adminId: chosenAdmin.id,
        tipoContratacionId: chosenTipo.id,
        distritoId,
        grupoActividadId,
        actividadId,
      };

      next = {
        ...next,
        predioDir: (await resolveDir(next.predioDir)) ?? next.predioDir,
        propDir: (await resolveDir(next.propDir)) ?? next.propDir,
      };

      if (next.mismosDatosProp === 'si') {
        const resolvedPropDir = await resolveDir({ ...next.propDir });
        next = {
          ...next,
          fiscalTipoPersona: next.propTipoPersona,
          fiscalRazonSocial: next.propRazonSocial,
          fiscalRfc: next.propRfc,
          fiscalCorreo: next.propCorreo,
          fiscalDir: resolvedPropDir ?? { ...next.propDir },
        };
      } else {
        next = { ...next, fiscalDir: (await resolveDir(next.fiscalDir)) ?? next.fiscalDir };
      }

      setForm(next);
      toast.success('Datos de demo cargados');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar catálogos';
      toast.error('No se pudo prellenar', { description: message });
    }
  }

  async function handleGuardar() {
    const validationErrors = validateCeafus01(form);
    if (validationErrors.length > 0) {
      toast.error('Complete los campos obligatorios', {
        description: validationErrors.slice(0, 5).join(' · '),
      });
      return;
    }

    const propNombreCompleto = deriveName(form);
    const predioResumen = derivePredioResumen(form);

    if (isEditMode && id) {
      try {
        await updateMutation.mutateAsync({
          sid: id,
          dto: {
            propNombreCompleto,
            propRfc: form.propRfc || undefined,
            propCorreo: form.propCorreo || undefined,
            propTelefono: form.propTelefono || undefined,
            predioResumen,
            claveCatastral: form.claveCatastral || undefined,
            adminId: form.adminId || undefined,
            tipoContratacionId: form.tipoContratacionId || undefined,
            formData: form,
          },
        });
      } catch {
        store.updateFormData(id, form);
      }
      toast.success('Solicitud actualizada');
    } else {
      try {
        const dto = await createMutation.mutateAsync({
          propTipoPersona: form.propTipoPersona === 'moral' ? 'moral' : 'fisica',
          propNombreCompleto,
          propRfc: form.propRfc || undefined,
          propCorreo: form.propCorreo || undefined,
          propTelefono: form.propTelefono || undefined,
          predioResumen,
          claveCatastral: form.claveCatastral || undefined,
          adminId: form.adminId || undefined,
          tipoContratacionId: form.tipoContratacionId || undefined,
          formData: form,
        });
        toast.success(`Solicitud ${dto.folio} registrada`);
      } catch {
        const record = store.create(form);
        toast.success(`Solicitud ${record.folio} registrada`);
        navigate('/app/solicitudes');
        return;
      }
    }
    navigate('/app/solicitudes');
  }

  const saving = createMutation.isPending || updateMutation.isPending;

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
              {!isEditMode
                ? 'CEA-FUS01 — Solicitud de Servicios'
                : isSolicitudLoading && !localRecord
                  ? 'Cargando solicitud…'
                  : existingRecord
                    ? `Editar solicitud — ${existingRecord.folio}`
                    : 'Editar solicitud'}
            </h1>
            <p
              className="mt-1 inline-flex flex-wrap items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-sm font-semibold text-amber-950 shadow-sm dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-50"
              role="note"
            >
              <span className="text-base font-bold leading-none text-destructive">*</span>
              <span>
                Los campos con <span className="font-bold text-destructive">*</span> son obligatorios
              </span>
            </p>
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

      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mx-auto max-w-4xl space-y-10">
          <FormSection title="A. Predio donde se requerirán los servicios">
            <StepPredio form={form} set={set} />
          </FormSection>

          <Separator />

          <FormSection title="B. Datos del propietario">
            <StepPropietario form={form} set={set} />
          </FormSection>

          <Separator />

          <FormSection title="C. Facturación">
            <StepFiscal form={form} set={set} />
          </FormSection>

          <Separator />

          <FormSection title="D. Uso del servicio">
            <StepSolicitud form={form} set={set} />
          </FormSection>

          <Separator />

          <FormSection title="E. Contratación">
            <StepContratacion form={form} set={set} />
          </FormSection>

          <Separator />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                id="generar-orden-inspeccion"
                checked={form.generarOrdenInspeccion}
                onCheckedChange={(c) => set({ generarOrdenInspeccion: c === true })}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Generar orden de inspección</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Si se marca, el trámite quedará en espera de inspección; si no, en espera de cliente (hasta conectar el sistema de órdenes).
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={() => navigate('/app/solicitudes')}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={() => void handleGuardar()}
          disabled={saving}
          className="min-w-[180px] bg-[#007BFF] text-white hover:bg-blue-600"
        >
          {saving ? 'Guardando…' : isEditMode ? 'Guardar cambios' : 'Enviar solicitud'}
        </Button>
      </div>
    </div>
  );
}
