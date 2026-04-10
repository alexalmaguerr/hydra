import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buscarContratos, type ContratoSearch } from '@/api/atencion';

interface BusquedaContratoProps {
  contratoSeleccionado: ContratoSearch | null;
  onSelect: (contrato: ContratoSearch) => void;
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
  'Pendiente de toma': 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  'Pendiente de zona': 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
};

export default function BusquedaContrato({ contratoSeleccionado, onSelect }: BusquedaContratoProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [resultados, setResultados] = useState<ContratoSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResultados([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await buscarContratos(q);
        setResultados(data);
        setOpen(true);
      } catch {
        setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(c: ContratoSearch) {
    onSelect(c);
    setQuery('');
    setOpen(false);
    setResultados([]);
  }

  function handleClear() {
    setQuery('');
    setResultados([]);
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
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => resultados.length > 0 && setOpen(true)}
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
          </div>
        </div>
      )}

      {loading && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-4 py-3 text-sm text-muted-foreground">
          Buscando...
        </div>
      )}

      {open && !loading && query.trim().length >= 2 && resultados.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-4 py-3 text-sm text-muted-foreground">
          Sin resultados para "{query}"
        </div>
      )}
    </div>
  );
}
