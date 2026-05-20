import { Request, Response } from "express";
import { ListOrdemdeServicoService } from "../../../services/controles_forms/OrdemdeServico/ListOrdemdeServicoService";

class ListOrdemdeServicoController {
    async handle(req: Request, res: Response) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        const user_id = req.user_id as string;

        const { 
            startDate, 
            endDate, 
            cliente_id, 
            instituicao_id,
            tarefa_id 
        } = req.query;

        const service = new ListOrdemdeServicoService();

        const result = await service.execute({ 
            user_id,
            startDate: startDate as string,
            endDate: endDate as string,
            cliente_id: cliente_id as string,
            instituicao_id: instituicao_id as string,
            tarefa_id: tarefa_id as string 
        });

        return res.json(result);
    }
}

export { ListOrdemdeServicoController };