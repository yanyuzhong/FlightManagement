import { Router } from "express";
import { getFlightsController, getFlightsByAircraftController, getTotalHoursController } from "../../controllers/flightController.js";

const router = Router();

router.get("/flights", getFlightsController);
router.get("/flights/aircraft/:aircraftId", getFlightsByAircraftController);
router.get("/flights/total-hours", getTotalHoursController);

export default router;
