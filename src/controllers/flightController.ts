import { Request, Response, NextFunction } from "express";
import { FlightStatus } from "../models/flightLog.js";
import { getFlightLogs, getFlightsByAircraft } from "../services/flightService.js";

export async function getFlightsController(req: Request, res: Response, next: NextFunction) {
	try {
		const limitParam = req.query.limit;
		const cursorParam = req.query.cursor;
		const sortOrderParam = req.query.sortby;

		// Default limit
		let limit = 20;

		if (limitParam !== undefined) {
			const parsedLimit = Number(limitParam);

			if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
				res.status(400).json({
					error: "limit must be an integer between 1 and 100",
				});

				return;
			}

			limit = parsedLimit;
		}

		// Validate cursor
		let cursor: string | undefined;

		if (cursorParam !== undefined) {
			if (typeof cursorParam !== "string") {
				res.status(400).json({
					error: "Invalid cursor",
				});

				return;
			}

			cursor = cursorParam;
		}

		// Default sorting
		let sortOrder: "asc" | "desc" = "desc";

		if (sortOrderParam !== undefined) {
			if (sortOrderParam !== "asc" && sortOrderParam !== "desc") {
				res.status(400).json({
					error: "sortOrder must be 'asc' or 'desc'",
				});

				return;
			}

			sortOrder = sortOrderParam;
		}

		const result = await getFlightLogs({
			limit,
			cursor,
			sortOrder,
		});

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

export async function getFlightsByAircraftController(req: Request, res: Response, next: NextFunction) {
	try {
		const aircraftId = req.params.aircraftId;
		const statusParam = req.query.status;

		if (typeof aircraftId !== "string" || aircraftId.trim() === "") {
			res.status(400).json({
				error: "aircraftId is required",
			});

			return;
		}

		let status: FlightStatus | undefined;

		if (statusParam !== undefined) {
			if (typeof statusParam !== "string" || !isFlightStatus(statusParam)) {
				res.status(400).json({
					error: "status must be one of: scheduled, departed, landed, canceled",
				});

				return;
			}

			status = statusParam;
		}

		const flights = await getFlightsByAircraft({
			aircraftId,
			status,
		});

		res.status(200).json({
			data: flights,
		});
	} catch (error) {
		next(error);
	}
}

function isFlightStatus(value: string): value is FlightStatus {
	return value === "scheduled" || value === "departed" || value === "landed" || value === "canceled";
}
