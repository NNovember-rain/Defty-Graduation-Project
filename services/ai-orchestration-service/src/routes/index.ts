import { Router } from 'express';
import promptRoutes from "./prompt.routes";
import umlKnowledgeBaseRoutes from "./uml-knowledge-base.routes";

const router = Router();

router.use("/prompts", promptRoutes);
router.use("/uml-knowledge-base", umlKnowledgeBaseRoutes);

export default router;