import { Router } from 'express';
import promptRoutes from "./prompt.routes";

const router = Router();

router.use("/prompts", promptRoutes);

export default router;