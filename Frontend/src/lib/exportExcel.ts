// lib/exportExcel.ts
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import { toast } from 'sonner';

interface ExportParams {
  startDate?: string;
  endDate?: string;
  tarefa_id?: string;
  cliente_id?: string;
  instituicao_id?: string;
  status_id?: string;
  tipoOS_id?: string;
}

export async function exportOrdemServicoExcel(params: ExportParams) {
  try {
    const token = await getCookieClient();
    
    const response = await api.get('/ordens/exportar', {
      params,
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_OS_${new Date().getTime()}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success("Excel gerado com sucesso!");
  } catch (error) {
    console.error("Erro na exportação:", error);
    toast.error("Erro ao exportar relatório. Verifique sua conexão.");
    throw error; // Repassa o erro para o componente tratar o loading
  }
}