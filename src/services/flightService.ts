import { Types } from "mongoose";

import { FlightLog, FlightStatus } from "../models/flightLog.js";

import { FlightCursor, decodeCursor, encodeCursor } from "./flightCursor.js";

export interface GetFlightLogsParams {
	limit: number;
	cursor?: string;
	sortOrder: "asc" | "desc";
}

export interface GetFlightsByAircraftParams {
	aircraftId: string;
	status?: FlightStatus;
}

export interface GetTotalFlightHoursParams {
	startDate: Date;
	endDate: Date;
}

export async function getFlightLogs(params: GetFlightLogsParams) {
	const { limit, cursor, sortOrder } = params;

	const sortDirection = sortOrder === "asc" ? 1 : -1;

	const filter: Record<string, unknown> = {};

	// if there's a cursor, we only retrieve data after the cursor
	if (cursor) {
		const decodedCursor = decodeCursor(cursor);

		const cursorDate = new Date(decodedCursor.departureTime);

		const cursorId = decodedCursor.id;

		if (sortDirection === -1) {
			// sort by least recent timestamp, and if there's duplicate timestamp,
			// sort by the smaller cursorId
			filter.$or = [
				{
					departureTime: {
						$lt: cursorDate,
					},
				},
				{
					departureTime: cursorDate,
					_id: {
						$lt: cursorId,
					},
				},
			];
		} else {
			// sort by most recent timestamp, and if there's duplicate timestamp,
			// sort by the larger cursorId
			filter.$or = [
				{
					departureTime: {
						$gt: cursorDate,
					},
				},
				{
					departureTime: cursorDate,
					_id: {
						$gt: cursorId,
					},
				},
			];
		}
	}

	// fetch one extra record to determine whether another page exists
	const flights = await FlightLog.find(filter)
		.sort({
			departureTime: sortDirection,
			_id: sortDirection,
		})
		.limit(limit + 1)
		.lean();

	const hasNextPage = flights.length > limit;

	if (hasNextPage) {
		flights.pop();
	}

	let nextCursor: string | null = null;

	if (hasNextPage && flights.length > 0) {
		const lastFlight = flights[flights.length - 1];

		// return the base64 encoded cursor so we don't expose implementation details
		// to the client
		nextCursor = encodeCursor({
			departureTime: lastFlight.departureTime.toISOString(),
			id: lastFlight._id.toString(),
		});
	}

	return {
		data: flights,
		pagination: {
			limit,
			hasNextPage,
			nextCursor,
		},
	};
}

export async function getFlightsByAircraft(params: GetFlightsByAircraftParams) {
	const { aircraftId, status } = params;

	const filter: {
		aircraftId: string;
		status?: FlightStatus;
	} = {
		aircraftId,
	};

	if (status !== undefined) {
		filter.status = status;
	}

	return FlightLog.find(filter)
		.sort({
			departureTime: -1,
			_id: -1,
		})
		.lean();
}

export async function getTotalFlightHours(params: GetTotalFlightHoursParams) {
	const { startDate, endDate } = params;

	const result = await FlightLog.aggregate([
		{
			$match: {
				status: "landed",
				departureTime: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: null,
				totalMinutes: {
					$sum: "$durationMinutes",
				},
			},
		},
	]);

	const totalMinutes = result.length > 0 ? result[0].totalMinutes : 0;

	return {
		totalHours: totalMinutes / 60,
	};
}
