import { useQuery } from '@tanstack/react-query';
import { fetchTipoContratacionConfiguracion, type TipoContratacionConfiguracion } from '@/api/tipos-contratacion';

export function useTipoContratacionConfig(tipoContratacionId: string | undefined) {
  return useQuery<TipoContratacionConfiguracion>({
    queryKey: ['tipo-contratacion-config', tipoContratacionId],
    queryFn: () => fetchTipoContratacionConfiguracion(tipoContratacionId!),
    enabled: !!tipoContratacionId,
  });
}
