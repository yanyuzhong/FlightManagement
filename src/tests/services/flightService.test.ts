import { beforeEach, describe, expect, it, vi } from "vitest";

import { FlightLog } from "../../models/flightLog.js";
import { getFlightLogs, getFlightsByAircraft, getTotalFlightHours } from "../../services/flightService.js";
import { encodeCursor } from "../../services/flightCursor.js";

vi.mock("../../models/flightLog.js", () => ({
	FlightLog: {
		find: vi.fn(),
		aggregate: vi.fn(),
	},
}));

describe("flightService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getFlightLogs", () => {
		function mockFind(flights: unknown[]) {
			const lean = vi.fn().mockResolvedValue(flights);
			const limit = vi.fn().mockReturnValue({ lean });
			const sort = vi.fn().mockReturnValue({ limit });

			vi.mocked(FlightLog.find).mockReturnValue({
				sort,
			} as never);

			return {
				sort,
				limit,
				lean,
			};
		}

		it("should return the requested number of flights and indicate the next page", async () => {
			const flights = [
				{
					_id: "id-1",
					flightId: "CX001",
					departureTime: new Date("2026-01-03T10:00:00Z"),
				},
				{
					_id: "id-2",
					flightId: "CX002",
					departureTime: new Date("2026-01-02T10:00:00Z"),
				},
				{
					_id: "id-3",
					flightId: "CX003",
					departureTime: new Date("2026-01-01T10:00:00Z"),
				},
			];

			const { sort, limit } = mockFind(flights);

			const result = await getFlightLogs({
				limit: 2,
				sortOrder: "desc",
			});

			expect(FlightLog.find).toHaveBeenCalledWith({});

			expect(sort).toHaveBeenCalledWith({
				departureTime: -1,
				_id: -1,
			});

			expect(limit).toHaveBeenCalledWith(3);

			expect(result.data).toHaveLength(2);
			expect(result.pagination.limit).toBe(2);
			expect(result.pagination.hasNextPage).toBe(true);
			expect(result.pagination.nextCursor).toBe("eyJkZXBhcnR1cmVUaW1lIjoiMjAyNi0wMS0wMlQxMDowMDowMC4wMDBaIiwiaWQiOiJpZC0yIn0");
		});

		it("should return no next cursor when there are no more results", async () => {
			const flights = [
				{
					_id: "id-1",
					flightId: "CX001",
					departureTime: new Date("2026-01-03T10:00:00Z"),
				},
				{
					_id: "id-2",
					flightId: "CX002",
					departureTime: new Date("2026-01-02T10:00:00Z"),
				},
			];

			mockFind(flights);

			const result = await getFlightLogs({
				limit: 2,
				sortOrder: "desc",
			});

			expect(result.data).toHaveLength(2);
			expect(result.pagination.hasNextPage).toBe(false);
			expect(result.pagination.nextCursor).toBeNull();
		});

		it("should sort ascending when sortOrder is asc", async () => {
			const { sort } = mockFind([]);

			await getFlightLogs({
				limit: 20,
				sortOrder: "asc",
			});

			expect(sort).toHaveBeenCalledWith({
				departureTime: 1,
				_id: 1,
			});
		});

		it("should use the cursor to construct a descending pagination filter", async () => {
			const cursor = encodeCursor({
				departureTime: "2026-01-02T10:00:00.000Z",
				id: "507f1f77bcf86cd799439011",
			});

			mockFind([]);

			await getFlightLogs({
				limit: 20,
				cursor,
				sortOrder: "desc",
			});

			expect(FlightLog.find).toHaveBeenCalledWith({
				$or: [
					{
						departureTime: {
							$lt: new Date("2026-01-02T10:00:00.000Z"),
						},
					},
					{
						departureTime: new Date("2026-01-02T10:00:00.000Z"),
						_id: {
							$lt: "507f1f77bcf86cd799439011",
						},
					},
				],
			});
		});
	});

	describe("getFlightsByAircraft", () => {
		function mockFind(flights: unknown[]) {
			const lean = vi.fn().mockResolvedValue(flights);
			const sort = vi.fn().mockReturnValue({ lean });

			vi.mocked(FlightLog.find).mockReturnValue({
				sort,
			} as never);

			return {
				sort,
				lean,
			};
		}

		it("should filter by aircraftId", async () => {
			const flights = [
				{
					flightId: "CX001",
					aircraftId: "R111",
				},
			];

			const { sort } = mockFind(flights);

			const result = await getFlightsByAircraft({
				aircraftId: "R111",
			});

			expect(FlightLog.find).toHaveBeenCalledWith({
				aircraftId: "R111",
			});

			expect(sort).toHaveBeenCalledWith({
				departureTime: -1,
				_id: -1,
			});

			expect(result).toEqual(flights);
		});

		it("should filter by aircraftId and status", async () => {
			const flights = [
				{
					flightId: "CX001",
					aircraftId: "R111",
					status: "landed",
				},
			];

			mockFind(flights);

			const result = await getFlightsByAircraft({
				aircraftId: "R111",
				status: "landed",
			});

			expect(FlightLog.find).toHaveBeenCalledWith({
				aircraftId: "R111",
				status: "landed",
			});

			expect(result).toEqual(flights);
		});
	});

	describe("getTotalFlightHours", () => {
		it("should calculate total flight hours", async () => {
			vi.mocked(FlightLog.aggregate).mockResolvedValue([
				{
					_id: null,
					totalMinutes: 270,
				},
			]);

			const startDate = new Date("2026-01-01T00:00:00Z");
			const endDate = new Date("2026-02-01T00:00:00Z");

			const result = await getTotalFlightHours({
				startDate,
				endDate,
			});

			expect(FlightLog.aggregate).toHaveBeenCalledWith([
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

			expect(result).toEqual({
				totalHours: 4.5,
			});
		});

		it("should return zero hours when no flights match", async () => {
			vi.mocked(FlightLog.aggregate).mockResolvedValue([]);

			const result = await getTotalFlightHours({
				startDate: new Date("2026-01-01T00:00:00Z"),
				endDate: new Date("2026-02-01T00:00:00Z"),
			});

			expect(result).toEqual({
				totalHours: 0,
			});
		});
	});
});
