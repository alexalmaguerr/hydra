import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { QuejaAclaracion, QuejaCategoria, QuejaPrioridad, QuejaCanal, QuejaAreaAsignada } from '@/context/DataContext';

interface QuejaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contratoId: string;
  usuarioActual?: string;
  onSubmit: (q: Omit<QuejaAclaracion, 'id'>) => void;
}

const CATEGORIAS: QuejaCategoria[] = ['Facturación', 'Servicio', 'Medidor', 'Lectura', 'Corte/Reconexión', 'Cobro', 'Otro'];
const PRIORIDADES: QuejaPrioridad[] = ['Baja', 'Media', 'Alta', 'Urgente'];
const CANALES: QuejaCanal[] = ['Ventanilla', 'Teléfono', 'Portal web', 'Correo', 'Redes sociales'];
const AREAS: QuejaAreaAsignada[] = ['Atención a clientes', 'Operación', 'Facturación', 'Jurídico', 'Cartera'];

const DEFAULT_FORM = {
  tipo: 'Queja' as 'Queja' | 'Aclaración',
  categoria: '' as QuejaCategoria | '',
  prioridad: 'Media' as QuejaPrioridad,
  canal: 'Ventanilla' as QuejaCanal,
  areaAsignada: 'Atención a clientes' as QuejaAreaAsignada,
  descripcion: '',
  enlaceExterno: '',
};

export default function QuejaDialog({ open, onOpenChange, contratoId, usuarioActual, onSubmit }: QuejaDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof DEFAULT_FORM, string>>>({});

  function validate() {
    const e: typeof errors = {};
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida';
    if (!form.categoria) e.categoria = 'Selecciona una categoría';
    if (form.enlaceExterno && !isValidUrl(form.enlaceExterno)) e.enlaceExterno = 'URL no válida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function isValidUrl(s: string) {
    try { new URL(s); return true; } catch { return false; }
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      contratoId,
      fecha: new Date().toISOString().slice(0, 10),
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      estado: 'Registrada',
      atendidoPor: usuarioActual,
      categoria: form.categoria as QuejaCategoria,
      prioridad: form.prioridad,
      canal: form.canal,
      areaAsignada: form.areaAsignada,
      enlaceExterno: form.enlaceExterno.trim() || undefined,
      seguimientos: [],
    });
    setForm(DEFAULT_FORM);
    setErrors({});
    onOpenChange(false);
  }

  function handleClose() {
    setForm(DEFAULT_FORM);
    setErrors({});
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Nueva queja / aclaración</DialogTitle>
          <DialogDescription>
            Registra la queja o aclaración del cliente. Selecciona la categoría y canal de atención.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo <span className="text-red-500">*</span></Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as typeof f.tipo }))}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Queja">Queja</SelectItem>
                  <SelectItem value="Aclaración">Aclaración</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría <span className="text-red-500">*</span></Label>
              <Select value={form.categoria} onValueChange={v => { setForm(f => ({ ...f, categoria: v as QuejaCategoria })); setErrors(e => ({ ...e, categoria: undefined })); }}>
                <SelectTrigger id="categoria" className={errors.categoria ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria}</p>}
            </div>
          </div>

          {/* Prioridad y Canal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select value={form.prioridad} onValueChange={v => setForm(f => ({ ...f, prioridad: v as QuejaPrioridad }))}>
                <SelectTrigger id="prioridad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="canal">Canal</Label>
              <Select value={form.canal} onValueChange={v => setForm(f => ({ ...f, canal: v as QuejaCanal }))}>
                <SelectTrigger id="canal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Área asignada */}
          <div className="space-y-1.5">
            <Label htmlFor="area">Área asignada</Label>
            <Select value={form.areaAsignada} onValueChange={v => setForm(f => ({ ...f, areaAsignada: v as QuejaAreaAsignada }))}>
              <SelectTrigger id="area">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></Label>
            <Textarea
              id="descripcion"
              value={form.descripcion}
              onChange={e => { setForm(f => ({ ...f, descripcion: e.target.value })); setErrors(e2 => ({ ...e2, descripcion: undefined })); }}
              placeholder="Describe el motivo de la queja o aclaración..."
              rows={3}
              className={errors.descripcion ? 'border-red-500' : ''}
            />
            {errors.descripcion && <p className="text-xs text-red-500">{errors.descripcion}</p>}
          </div>

          {/* Enlace externo */}
          <div className="space-y-1.5">
            <Label htmlFor="enlace">
              Enlace a sistema externo
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="enlace"
              value={form.enlaceExterno}
              onChange={e => { setForm(f => ({ ...f, enlaceExterno: e.target.value })); setErrors(e2 => ({ ...e2, enlaceExterno: undefined })); }}
              placeholder="https://sistema-reclamos.ejemplo.com/ticket/123"
              className={errors.enlaceExterno ? 'border-red-500' : ''}
            />
            {errors.enlaceExterno && <p className="text-xs text-red-500">{errors.enlaceExterno}</p>}
            <p className="text-xs text-muted-foreground">Referencia a herramienta externa de gestión de reclamos</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
