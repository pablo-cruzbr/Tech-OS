import { Request, Response } from "express";
import { ListOrdemdeServicoService } from "../../../services/controles_forms/OrdemdeServico/ListOrdemdeServicoService";
import ExcelJS from "exceljs";

// Definindo a interface para garantir que o TS entenda a estrutura dos dados vindos do banco
interface OSData {
  numeroOS?: string | null;
  created_at?: Date | string;
  tarefa?: { name: string } | null;
  cliente?: { name: string } | null;
  instituicaoUnidade?: { name: string } | null;
  tecnico?: { name: string } | null;
  nameTecnico?: string | null;
  statusOrdemdeServico?: { name: string } | null;
  descricaodoProblemaouSolicitacao?: string | null;
}

class ExportOrdemdeServicoController {
  async handle(req: Request, res: Response) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    const user_id = req.user_id as string;
    const { startDate, endDate, cliente_id, instituicao_id, tarefa_id } = req.query;

    const listService = new ListOrdemdeServicoService();

    // 1. Obtém os dados
    const { controles } = await listService.execute({
      user_id,
      startDate: startDate as string,
      endDate: endDate as string,
      cliente_id: cliente_id as string,
      instituicao_id: instituicao_id as string,
      tarefa_id: tarefa_id as string,
    });

    // 2. Configura a Planilha
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório de OS");

    worksheet.columns = [
      { header: "Nº OS", key: "numeroOS", width: 10 },
      { header: "DATA CADASTRO", key: "created_at", width: 20 },
      { header: "TAREFA", key: "tarefa", width: 25 },
      { header: "CLIENTE", key: "cliente", width: 30 },
      { header: "UNIDADE", key: "unidade", width: 30 },
      { header: "TÉCNICO", key: "tecnico", width: 20 },
      { header: "STATUS", key: "status", width: 15 },
      { header: "HISTÓRICO/DESCRIÇÃO", key: "descricao", width: 50 },
    ];

    // 3. Mapeamento seguro usando a interface definida
    controles.forEach((os: any) => {
      worksheet.addRow({
        numeroOS: os.numeroOS || "N/A",
        created_at: os.created_at ? new Date(os.created_at).toLocaleString('pt-BR') : "",
        tarefa: os.tarefa?.name || "Não definida",
        cliente: os.cliente?.name || "Sem Cliente",
        unidade: os.instituicaoUnidade?.name || "Sem Unidade",
        tecnico: os.tecnico?.name || os.nameTecnico || "Não Atribuído",
        status: os.statusOrdemdeServico?.name || "N/A",
        descricao: os.descricaodoProblemaouSolicitacao || "",
      });
    });

    // 4. Estilização
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4E3182' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin', color: { argb: 'FFD3D3D3' } }, left: { style: 'thin', color: { argb: 'FFD3D3D3' } }, bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } }, right: { style: 'thin', color: { argb: 'FFD3D3D3' } } };
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        });
        row.height = 22;
      }
    });

    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // 5. Cabeçalhos de resposta (Cache control adicionado para resolver o 304)
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=Relatorio_OS_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.status(200).end();
  }
}

export { ExportOrdemdeServicoController };