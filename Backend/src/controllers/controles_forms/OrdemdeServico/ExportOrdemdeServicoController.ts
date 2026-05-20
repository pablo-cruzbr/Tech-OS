import { Request, Response } from "express";
import { ListOrdemdeServicoService } from "../../../services/controles_forms/OrdemdeServico/ListOrdemdeServicoService";
import ExcelJS from "exceljs";

class ExportOrdemdeServicoController {
  async handle(req: Request, res: Response) {
    const user_id = req.user_id as string;
    const { startDate, endDate, cliente_id, instituicao_id, tarefa_id } = req.query;

    const listService = new ListOrdemdeServicoService();

    // 1. Reutilizamos o Service de Listagem para pegar os dados filtrados
    const { controles } = await listService.execute({
      user_id,
      startDate: startDate as string,
      endDate: endDate as string,
      cliente_id: cliente_id as string,
      instituicao_id: instituicao_id as string,
      tarefa_id: tarefa_id as string,
    });

    // 2. Iniciamos a criação da Planilha
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Relatório de OS");

    // 3. Definimos as colunas (Headers)
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

    // 4. Mapeamos os dados do banco para as linhas do Excel
    // Altere o seu forEach para ficar exatamente assim:
controles.forEach((os: any) => {
  worksheet.addRow({
    numeroOS: os.numeroOS || "N/A",
    created_at: os.created_at ? new Date(os.created_at).toLocaleString('pt-BR') : "",
    // O TS reclama porque 'tarefa' é um objeto relacionado. 
    // Certifique-se de que o 'select' no Service inclui o campo 'tarefa'
    tarefa: os.tarefa?.name || "Não definida",
    cliente: os.cliente?.name || "Sem Cliente",
    unidade: os.instituicaoUnidade?.name || "Sem Unidade",
    tecnico: os.tecnico?.name || os.nameTecnico || "Não Atribuído",
    status: os.statusOrdemdeServico?.name || "N/A",
    descricao: os.descricaodoProblemaouSolicitacao || "",
  });
});
    // Estilização básica do cabeçalho
    // 1. Estilizar a linha do Cabeçalho (Linha 1) com a cor do sistema #4E3182
const headerRow = worksheet.getRow(1);

headerRow.eachCell((cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4E3182' }, // Cor do seu sistema (Roxo)
  };
  cell.font = {
    bold: true,
    color: { argb: 'FFFFFFFF' }, // Texto Branco para dar contraste
    size: 11
  };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Bordas brancas no cabeçalho ficam bem elegantes com fundo escuro
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
  };
});

// 2. Aplicar bordas cinzas e alinhamento nas linhas de dados
worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
  if (rowNumber > 1) {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
        right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
      };
      cell.alignment = { 
        vertical: 'middle', 
        horizontal: 'left', 
        wrapText: true 
      };
    });
    
    // Deixar as linhas com uma altura boa para leitura
    row.height = 22;
  }
});

// 3. Ajuste fino: Congelar o cabeçalho para que ele não suma ao dar scroll
worksheet.views = [
  { state: 'frozen', xSplit: 0, ySplit: 1 }
];

    // 5. Response para Download de Arquivo
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `Relatorio_OS_${Date.now()}.xlsx`
    );

    // Escreve o buffer e envia para o cliente
    await workbook.xlsx.write(res);
    res.status(200).end();
  }
}

export { ExportOrdemdeServicoController };