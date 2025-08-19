import { Router } from 'express';
import promptRoutes from "./prompt.routes";
import plantumlRoutes from "./plantuml.routes";

const router = Router();

router.use("/prompts", promptRoutes);
router.use("/plantuml", plantumlRoutes);

export default router;