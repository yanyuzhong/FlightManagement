import express from "express";
import flightRoutes from "./routes/v1/flightRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());

app.use("/api/v1", flightRoutes);

app.use(errorHandler);

export default app;
