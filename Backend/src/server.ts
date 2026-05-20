import express from "express";
import type { Request, Response, NextFunction } from "express"; 
import 'express-async-errors';
import cors from 'cors'; 
import path from 'path'; 
import fileUpload from 'express-fileupload'; 
import { router } from "./routes"; 

const app = express();

app.use(express.json());app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors()); 

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  parseNested: true, 
  limits: { fileSize: 50 * 1024 * 1024 }, 
  debug: false,
}));

app.get("/hello", (req, res) => {
  return res.json({
    status: "online",
    message: "Servidor TechOS funcionando com sucesso!",
    timestamp: new Date().toISOString()
  });
});

app.use(router); 

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

app.listen(3334, () => {
  console.log('Servidor API AlltiControl Online na porta 3334!');
});

export default app;