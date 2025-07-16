import { Router } from 'express';
import promptRoutes from "./prompt.routes";

const router = Router();

router.use("/prompt", promptRoutes);

export default router;