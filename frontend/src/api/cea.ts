/**
 * CEA Aquacis SOAP/REST API client.
 * Ported from ticket-ace-portal-10225 — only includes functions used by the client portal.
 * All requests are proxied through Vite dev server (/ceadevws, /aquacis-cea) in development.
 */

const CEA_SOAP_CONTRACT_URL = import.meta.env.VITE_CEA_SOAP_CONTRACT_URL as string;
const CEA_SOAP_DEBT_URL = import.meta.env.VITE_CEA_SOAP_DEBT_URL as string;
const CEA_SOAP_READINGS_URL = import.meta.env.VITE_CEA_SOAP_READINGS_URL as string;
const CEA_API_USERNAME = import.meta.env.VITE_CEA_API_USERNAME as string;
const CEA_API_PASSWORD = import.meta.env.VITE_CEA_API_PASSWORD as string;
export const CEA_EXPLOTACION = (import.meta.env.VITE_CEA_EXPLOTACION as string) ?? '01';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape special characters for XML interpolation */
export const xmlEscape = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/** Parse an XML string into a Document, throwing on parse error */
const parseXmlResponse = (xmlString: string): Document => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Error parsing XML response from CEA API');
  }
  return xmlDoc;
};

/**
 * Recursively convert an XML Element or Document to a plain JS object.
 * Handles xsi:nil and repeated sibling elements (converted to arrays).
 */
export const xmlToJson = (node: Document | Element): any => {
  const parseElement = (el: Element): Record<string, any> => {
    const obj: Record<string, any> = {};
    const groups: Record<string, Element[]> = {};
    Array.from(el.children).forEach((c) => {
      const name = c.localName || c.nodeName;
      groups[name] = groups[name] || [];
      groups[name].push(c);
    });
    for (const [name, elems] of Object.entries(groups)) {
      obj[name] = elems.length > 1 ? elems.map(parseChild) : parseChild(elems[0]);
    }
    return obj;
  };

  const parseChild = (child: Element): any => {
    const xsiNil = child.getAttributeNS?.('http://www.w3.org/2001/XMLSchema-instance', 'nil');
    if (xsiNil === 'true' || xsiNil === '1') return null;
    if (child.children.length === 0) {
      const text = child.textContent;
      return text === null || text.trim() === '' ? null : text.trim();
    }
    return parseElement(child);
  };

  if ((node as Document).documentElement) {
    return parseElement((node as Document).documentElement as Element);
  }
  return parseElement(node as Element);
};

/** Generic SOAP request – sends XML body and returns parsed Document */
const sendSoapRequest = async (url: string, xmlBody: string): Promise<Document> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      SOAPAction: '',
    },
    body: xmlBody,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`CEA SOAP error ${res.status}: ${text.slice(0, 300)}`);
  }

  return parseXmlResponse(text);
};

// ─── WSS header helper ────────────────────────────────────────────────────────

const wssHeader = () => `
  <soapenv:Header>
    <wsse:Security mustUnderstand="1"
      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken wsu:Id="UsernameToken-${xmlEscape(CEA_API_USERNAME)}">
        <wsse:Username>${xmlEscape(CEA_API_USERNAME)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(CEA_API_PASSWORD)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>`;

// ─── CEA API functions ────────────────────────────────────────────────────────

/**
 * Fetches debt information for a given contract number.
 * Returns parsed JSON from the SOAP response.
 *
 * @param ceaNumContrato - The CEA/Aquacis contract number (e.g. "523160")
 * @param explotacion    - Exploitation code (e.g. "01" for Querétaro)
 */
export const getCeaDeuda = async (
  ceaNumContrato: string,
  explotacion: string = CEA_EXPLOTACION,
): Promise<CeaDeudaData | null> => {
  const xml = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:int="http://interfazgenericagestiondeuda.occamcxf.occam.agbar.com/">
  ${wssHeader()}
  <soapenv:Body>
    <int:getDeuda>
      <tipoIdentificador>CONTRATO</tipoIdentificador>
      <valor>${xmlEscape(ceaNumContrato)}</valor>
      <explotacion>${xmlEscape(explotacion)}</explotacion>
      <idioma>es</idioma>
    </int:getDeuda>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xmlDoc = await sendSoapRequest(CEA_SOAP_DEBT_URL, xml);
  const data = xmlToJson(xmlDoc);

  // Try multiple response paths (namespace prefixes vary)
  const deuda =
    data?.Body?.getDeudaResponse?.return?.deuda ??
    data?.getDeudaResponse?.return?.deuda ??
    data?.['ns2:getDeudaResponse']?.return?.deuda ??
    null;

  return deuda as CeaDeudaData | null;
};

/**
 * Fetches consumption history for a given contract.
 *
 * @param ceaNumContrato - The CEA/Aquacis contract number
 * @param explotacion    - Exploitation code (e.g. "01")
 */
export const getCeaConsumos = async (
  ceaNumContrato: string,
  explotacion: string = CEA_EXPLOTACION,
): Promise<CeaConsumo[]> => {
  const explotacionPadded = explotacion.padStart(2, '0');

  const xml = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:occ="http://occamWS.ejb.negocio.occam.agbar.com">
  <soapenv:Header>
    <wsse:Security mustUnderstand="1"
      xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
      xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken wsu:Id="UsernameToken-${xmlEscape(CEA_API_USERNAME)}">
        <wsse:Username>${xmlEscape(CEA_API_USERNAME)}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${xmlEscape(CEA_API_PASSWORD)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <occ:getConsumos>
      <explotacion>${xmlEscape(explotacionPadded)}</explotacion>
      <contrato>${xmlEscape(ceaNumContrato)}</contrato>
      <idioma>es</idioma>
    </occ:getConsumos>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xmlDoc = await sendSoapRequest(CEA_SOAP_READINGS_URL, xml);
  const data = xmlToJson(xmlDoc);

  // Try multiple paths for the Consumo array
  const raw =
    data?.Body?.getConsumosResponse?.getConsumosReturn?.Consumo ??
    data?.getConsumosResponse?.getConsumosReturn?.Consumo ??
    data?.getConsumosReturn?.Consumo ??
    data?.Consumo ??
    null;

  if (!raw) return [];

  const arr: any[] = Array.isArray(raw) ? raw : [raw];

  return arr.map((c): CeaConsumo => {
    const conceptosRaw = c.conceptos?.Concepto;
    const conceptosArr: any[] = conceptosRaw
      ? Array.isArray(conceptosRaw) ? conceptosRaw : [conceptosRaw]
      : [];

    const conceptos = conceptosArr.map((con: any) => ({
      id1: con.codigoConcepto?.id1Short ?? '',
      id2: con.codigoConcepto?.id2Short ?? '',
      descripcion: con.descripcionConcepto ?? '',
      importe: parseFloat(con.importe ?? '0'),
    }));

    return {
      ano: c.año ?? '',
      periodo: (c.periodo ?? '').replace(/<|>/g, ''),
      fechaInicio: c.fechaInicio ?? '',
      fechaFin: c.fechaFin ?? '',
      metrosCubicos: parseInt(c.metrosCubicos ?? '0', 10),
      importeTotal: conceptos.reduce((s, con) => s + con.importe, 0),
      conceptos,
    };
  });
};

/**
 * Fetches contract detail from CEA.
 */
export const getCeaContrato = async (
  ceaNumContrato: string,
): Promise<Record<string, any> | null> => {
  const xml = `<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:occ="http://occamWS.ejb.negocio.occam.agbar.com">
  <soapenv:Header/>
  <soapenv:Body>
    <occ:consultaDetalleContrato>
      <numeroContrato>${xmlEscape(ceaNumContrato)}</numeroContrato>
      <idioma>es</idioma>
    </occ:consultaDetalleContrato>
  </soapenv:Body>
</soapenv:Envelope>`;

  const xmlDoc = await sendSoapRequest(CEA_SOAP_CONTRACT_URL, xml);
  const returnEl =
    xmlDoc.getElementsByTagName('consultaDetalleContratoReturn')[0] ??
    xmlDoc.getElementsByTagName('consultaDetalleContratoResponse')[0];

  return returnEl ? xmlToJson(returnEl as Element) : xmlToJson(xmlDoc);
};

// ─── TypeScript interfaces ────────────────────────────────────────────────────

export interface CeaDeudaData {
  ciclosAnteriores: string | null;
  ciclosTotales: string | null;
  deuda: string | null;
  deudaComision: string | null;
  deudaTotal: string | null;
  direccion: string | null;
  documentoPago: string | null;
  documentoPagoAnterior: string | null;
  explotacion: string | null;
  nombreCliente: string | null;
  saldoAnterior: string | null;
  saldoAnteriorComision: string | null;
  saldoAnteriorTotal: string | null;
}

export interface CeaConsumo {
  ano: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  metrosCubicos: number;
  importeTotal: number;
  conceptos: {
    id1: string;
    id2: string;
    descripcion: string;
    importe: number;
  }[];
}
