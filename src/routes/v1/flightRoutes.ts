import { Router } from "express";
import { getFlightsController, getFlightsByAircraftController } from "../../controllers/flightController.js";

const router = Router();

router.get("/flights", getFlightsController);
router.get("/flights/aircraft/:aircraftId", getFlightsByAircraftController);

export default router;
