import { Router } from "express";
import { getFlights } from "../../controllers/flightController.js";

const router = Router();

router.get("/flights", getFlights);

export default router;
