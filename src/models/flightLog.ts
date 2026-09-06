import { Schema, model } from "mongoose";

export type FlightStatus = "scheduled" | "departed" | "landed" | "canceled";

interface FlightLog {
	flightId: string;
	aircraftId: string;
	departureAirport: string;
	arrivalAirport: string;
	departureTime: Date;
	arrivalTime: Date;
	status: FlightStatus;
	durationMinutes: number;
}

const flightLogSchema = new Schema<FlightLog>(
	{
		flightId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		aircraftId: {
			type: String,
			required: true,
		},
		departureAirport: {
			type: String,
			required: true,
		},
		arrivalAirport: {
			type: String,
			required: true,
		},
		departureTime: {
			type: Date,
			required: true,
		},
		arrivalTime: {
			type: Date,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: ["scheduled", "departed", "landed", "canceled"],
		},
		durationMinutes: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{
		collection: "FlightLogs",
		timestamps: true,
	}
);

// API 1: pagination + sorting
flightLogSchema.index({
	departureTime: -1,
	_id: -1,
});

// API 2: aircraft + optional status
flightLogSchema.index({
	aircraftId: 1,
	status: 1,
	departureTime: -1,
});

// API 3: landed flights within a date range
flightLogSchema.index({
	status: 1,
	departureTime: 1,
});

export const FlightLog = model<FlightLog>("FlightLog", flightLogSchema, "flightLogs");
