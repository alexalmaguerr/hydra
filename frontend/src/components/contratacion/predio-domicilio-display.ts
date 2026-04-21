import type { DomicilioFormValue } from '@/components/contratacion/DomicilioPickerForm';

/** Una sola línea legible a partir del formulario de domicilio del predio (solicitud). */
export function formatPredioDomicilioFromForm(d: DomicilioFormValue | undefined): string {
  if (!d) return '';
  const parts = [
    d.calle?.trim(),
    d.numExterior?.trim() ? `# ${d.numExterior.trim()}` : '',
    d.numInterior?.trim() ? `Int. ${d.numInterior.trim()}` : '',
    d.codigoPostal?.trim() ? `C.P. ${d.codigoPostal.trim()}` : '',
    d.referencia?.trim(),
  ].filter(Boolean);
  return parts.join(', ');
}
