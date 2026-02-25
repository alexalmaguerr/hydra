import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Contrato } from '@/context/DataContext';

interface BusquedaContratoProps {
  contratos: Contrato[];
  contratoSeleccionado: Contrato | null;
  onSelect: (contrato: Contrato) => void;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const ESTADO_COLORS: Record<string, string> = {
  'Activo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Suspendido': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Cancelado': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Pendiente de alta': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export default function BusquedaContrato({ contratos, contratoSeleccionado, onSelect }: BusquedaContratoProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resultados = query.trim().length < 2
    ? []
    : contratos.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.nombre.toLowerCase().includes(q) ||
          c.direccion.toLowerCase().includes(q) ||
          (c.rfc && c.rfc.toLowerCase().includes(q))
        );
      }).slice(0, 10);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(c: Contrato) {
    onSelect(c);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Buscar por contrato, nombre, dirección o RFC..."
            className="pl-9 pr-8"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {contratoSeleccionado && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <span className="font-medium text-foreground">{contratoSeleccionado.id}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                ESTADO_COLORS[contratoSeleccionado.estado] ?? 'bg-gray-100 text-gray-800'
              )}
            >
              {contratoSeleccionado.estado}
            </span>
          </div>
        )}
      </div>

      {open && resultados.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
          <ul className="py-1 max-h-72 overflow-y-auto">
            {resultados.map((c) => (
              <li key={c.id}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-3 rounded-none hover:bg-accent"
                  onClick={() => handleSelect(c)}
                >
                  <div className="flex flex-col items-start gap-0.5 text-left w-full">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-mono text-xs text-muted-foreground shrink-0">
                        {highlightMatch(c.id, query)}
                      </span>
                      <span className="font-medium text-sm truncate">
                        {highlightMatch(c.nombre, query)}
                      </span>
                      <span
                        className={cn(
                          'ml-auto px-1.5 py-0.5 rounded text-xs font-medium shrink-0',
                          ESTADO_COLORS[c.estado] ?? 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {c.estado}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {highlightMatch(c.direccion, query)}
                      {c.rfc && <> · {highlightMatch(c.rfc, query)}</>}
                    </span>
                  </div>
                </Button>
              </li>
            ))}
          </ul>
          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/40">
            {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
            {query.length >= 2 && contratos.filter(c => {
              const q = query.toLowerCase();
              return c.id.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q) || c.direccion.toLowerCase().includes(q);
            }).length > 10 && ' (mostrando los primeros 10)'}
          </div>
        </div>
      )}

      {open && query.trim().length >= 2 && resultados.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-4 py-3 text-sm text-muted-foreground">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}
