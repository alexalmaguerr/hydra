import type { SolicitudState } from '@/types/solicitudes';
import { SOLICITUD_STATE_EMPTY } from '@/types/solicitudes';
import type { PersonaWizard } from './hooks/useWizardState';

function tipoPersonaFromSolicitud(
  v: string | undefined,
): 'fisica' | 'moral' | '' {
  if (v === 'moral' || v === 'fisica') return v;
  return '';
}

/** Arma titular y fiscal del wizard a partir del JSON de solicitud (fuente de verdad operativa). */
export function solicitudFormToWizardPersonas(fd: SolicitudState): {
  propietario: PersonaWizard;
  personaFiscal: PersonaWizard;
  fiscalIgualTitular: boolean;
} {
  const tipoProp = tipoPersonaFromSolicitud(fd.propTipoPersona) || 'fisica';
  const propietario: PersonaWizard = {
    tipoPersona: tipoProp,
    paterno: fd.propPaterno,
    materno: fd.propMaterno,
    nombre: fd.propNombre,
    razonSocial: fd.propRazonSocial,
    rfc: fd.propRfc,
    email: fd.propCorreo,
    telefonos: fd.propTelefono,
    regimenFiscal: '',
    usoCfdi: '',
  };

  const fiscalIgualTitular = fd.mismosDatosProp === 'si';
  const tipoFis = tipoPersonaFromSolicitud(fd.fiscalTipoPersona) || tipoProp;

  const personaFiscal: PersonaWizard = fiscalIgualTitular
    ? { ...propietario }
    : {
        tipoPersona: tipoFis,
        paterno: '',
        materno: '',
        nombre: '',
        razonSocial: fd.fiscalRazonSocial,
        rfc: fd.fiscalRfc,
        email: fd.fiscalCorreo,
        telefonos: '',
        regimenFiscal: fd.fiscalRegimenFiscal,
        usoCfdi: fd.fiscalUsoCfdi,
      };

  return { propietario, personaFiscal, fiscalIgualTitular };
}

/** Actualiza `formData` y columnas resumidas del titular a partir del paso Personas del wizard. */
export function wizardPersonasToSolicitudUpdate(
  prev: SolicitudState,
  prop: PersonaWizard | undefined,
  fiscal: PersonaWizard | undefined,
  fiscalIgualTitular: boolean,
): {
  formData: SolicitudState;
  propNombreCompleto: string;
  propTipoPersona: string;
  propRfc: string | null;
  propCorreo: string | null;
  propTelefono: string | null;
} {
  const base: SolicitudState = { ...SOLICITUD_STATE_EMPTY, ...prev };
  const tipoProp = prop?.tipoPersona === 'moral' ? 'moral' : prop?.tipoPersona === 'fisica' ? 'fisica' : base.propTipoPersona;

  base.propTipoPersona = tipoProp || base.propTipoPersona;
  base.propPaterno = prop?.paterno ?? '';
  base.propMaterno = prop?.materno ?? '';
  base.propNombre = prop?.nombre ?? '';
  base.propRazonSocial = prop?.razonSocial ?? '';
  base.propRfc = prop?.rfc ?? '';
  base.propCorreo = prop?.email ?? '';
  base.propTelefono = prop?.telefonos ?? '';

  base.mismosDatosProp = fiscalIgualTitular ? 'si' : 'no';

  if (fiscalIgualTitular) {
    base.fiscalTipoPersona = base.propTipoPersona;
    base.fiscalRazonSocial = base.propRazonSocial;
    base.fiscalRfc = base.propRfc;
    base.fiscalCorreo = base.propCorreo;
    base.fiscalRegimenFiscal = prop?.regimenFiscal ?? base.fiscalRegimenFiscal;
    base.fiscalUsoCfdi = prop?.usoCfdi ?? base.fiscalUsoCfdi;
  } else {
    const tipoFis = fiscal?.tipoPersona === 'moral' ? 'moral' : fiscal?.tipoPersona === 'fisica' ? 'fisica' : '';
    base.fiscalTipoPersona = tipoFis || base.fiscalTipoPersona;
    base.fiscalRazonSocial = fiscal?.razonSocial ?? '';
    base.fiscalRfc = fiscal?.rfc ?? '';
    base.fiscalCorreo = fiscal?.email ?? '';
    base.fiscalRegimenFiscal = fiscal?.regimenFiscal ?? '';
    base.fiscalUsoCfdi = fiscal?.usoCfdi ?? '';
  }

  const propNombreCompleto =
    prop?.tipoPersona === 'moral' && prop?.razonSocial?.trim()
      ? prop.razonSocial.trim()
      : [prop?.paterno, prop?.materno, prop?.nombre].filter(Boolean).join(' ').trim();

  return {
    formData: base,
    propNombreCompleto: propNombreCompleto || base.propNombreCompleto || 'Sin nombre',
    propTipoPersona: tipoProp || 'fisica',
    propRfc: base.propRfc.trim() || null,
    propCorreo: base.propCorreo.trim() || null,
    propTelefono: base.propTelefono.trim() || null,
  };
}
