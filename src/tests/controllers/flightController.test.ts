import { describe, expect, it, vi, beforeEach } from "vitest";

import { getFlightsController, getFlightsByAircraftController, getTotalHoursController } from "../../controllers/flightController.js";

import { getFlightLogs, getFlightsByAircraft, getTotalFlightHours } from "../../services/flightService.js";

vi.mock("../../services/flightService.js", () => ({
	getFlightLogs: vi.fn(),
	getFlightsByAircraft: vi.fn(),
	getTotalFlightHours: vi.fn(),
}));

function createMockResponse() {
	const res = {
		status: vi.fn(),
		json: vi.fn(),
	};

	res.status.mockReturnValue(res);

	return res;
}

function createMockNext() {
	return vi.fn();
}

describe("flightController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getFlightsController", () => {
		it("should use the default limit and sort order if nothing's provided", async () => {
			vi.mocked(getFlightLogs).mockResolvedValue({
				data: [],
				pagination: {
					limit: 20,
					hasNextPage: false,
					nextCursor: null,
				},
			});

			const req = {
				query: {},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsController(req, res, next);

			expect(getFlightLogs).toHaveBeenCalledWith({
				limit: 20,
				cursor: undefined,
				sortOrder: "desc",
			});

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});

		it("should accept a valid limit", async () => {
			vi.mocked(getFlightLogs).mockResolvedValue({
				data: [],
				pagination: {
					limit: 10,
					hasNextPage: false,
					nextCursor: null,
				},
			});

			const req = {
				query: {
					limit: "10",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsController(req, res, next);

			expect(getFlightLogs).toHaveBeenCalledWith({
				limit: 10,
				cursor: undefined,
				sortOrder: "desc",
			});
		});

		it("should reject a limit greater than 100", async () => {
			const req = {
				query: {
					limit: "101",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "limit must be an integer between 1 and 100",
			});

			expect(getFlightLogs).not.toHaveBeenCalled();
		});

		it("should reject an invalid sort order", async () => {
			const req = {
				query: {
					sortby: "invalid",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "sortOrder must be 'asc' or 'desc'",
			});

			expect(getFlightLogs).not.toHaveBeenCalled();
		});
	});

	describe("getFlightsByAircraftController", () => {
		it("should reject an invalid status", async () => {
			const req = {
				params: {
					aircraftId: "R111",
				},
				query: {
					status: "invalid",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsByAircraftController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "status must be one of: scheduled, departed, landed, canceled",
			});

			expect(getFlightsByAircraft).not.toHaveBeenCalled();
		});

		it("should pass aircraftId and status to the service", async () => {
			vi.mocked(getFlightsByAircraft).mockResolvedValue([]);

			const req = {
				params: {
					aircraftId: "R111",
				},
				query: {
					status: "landed",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getFlightsByAircraftController(req, res, next);

			expect(getFlightsByAircraft).toHaveBeenCalledWith({
				aircraftId: "R111",
				status: "landed",
			});

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				data: [],
			});
		});
	});

	describe("getTotalHoursController", () => {
		it("should reject missing dates", async () => {
			const req = {
				query: {},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getTotalHoursController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "startDate and endDate are required",
			});

			expect(getTotalFlightHours).not.toHaveBeenCalled();
		});

		it("should reject invalid dates", async () => {
			const req = {
				query: {
					startDate: "not-a-date",
					endDate: "2026-02-01",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getTotalHoursController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "startDate and endDate must be valid dates",
			});

			expect(getTotalFlightHours).not.toHaveBeenCalled();
		});

		it("should reject startDate after endDate", async () => {
			const req = {
				query: {
					startDate: "2026-02-10",
					endDate: "2026-02-01",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getTotalHoursController(req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);

			expect(res.json).toHaveBeenCalledWith({
				error: "startDate must be before endDate",
			});

			expect(getTotalFlightHours).not.toHaveBeenCalled();
		});

		it("should accept valid dates and return expected result", async () => {
			vi.mocked(getTotalFlightHours).mockResolvedValue({
				totalHours: 4.5,
			});

			const req = {
				query: {
					startDate: "2026-01-01T00:00:00.000Z",
					endDate: "2026-02-01T00:00:00.000Z",
				},
			} as any;

			const res = createMockResponse();
			const next = createMockNext();

			await getTotalHoursController(req, res, next);

			expect(getTotalFlightHours).toHaveBeenCalledWith({
				startDate: new Date("2026-01-01T00:00:00.000Z"),
				endDate: new Date("2026-02-01T00:00:00.000Z"),
			});

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				totalHours: 4.5,
			});
		});
	});
});
