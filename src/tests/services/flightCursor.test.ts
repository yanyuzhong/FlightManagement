import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "../../services/flightCursor.js";

describe("flightCursor", () => {
	describe("encodeCursor", () => {
		it("should encode a cursor", () => {
			const cursor = {
				departureTime: "2026-01-01T10:00:00.000Z",
				id: "507f1f77bcf86cd799439011",
			};

			const encoded = encodeCursor(cursor);

			expect(encoded).toBe("eyJkZXBhcnR1cmVUaW1lIjoiMjAyNi0wMS0wMVQxMDowMDowMC4wMDBaIiwiaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEifQ");
		});
	});

	describe("decodeCursor", () => {
		it("should decode a valid cursor", () => {
			const cursor = {
				departureTime: "2026-01-01T10:00:00.000Z",
				id: "507f1f77bcf86cd799439011",
			};

			const encoded = encodeCursor(cursor);

			expect(decodeCursor(encoded)).toEqual(cursor);
		});

		it("should reject a cursor with missing departureTime", () => {
			const encoded = Buffer.from(
				JSON.stringify({
					id: "507f1f77bcf86cd799439011",
				})
			).toString("base64url");

			expect(() => decodeCursor(encoded)).toThrow("Invalid cursor");
		});

		it("should reject a cursor with missing id", () => {
			const encoded = Buffer.from(
				JSON.stringify({
					departureTime: "2026-01-01T10:00:00.000Z",
				})
			).toString("base64url");

			expect(() => decodeCursor(encoded)).toThrow("Invalid cursor");
		});

		it("should reject a cursor with an invalid date", () => {
			const encoded = Buffer.from(
				JSON.stringify({
					departureTime: "not-a-date",
					id: "507f1f77bcf86cd799439011",
				})
			).toString("base64url");

			expect(() => decodeCursor(encoded)).toThrow("Invalid cursor");
		});

		it("should reject malformed cursor data", () => {
			expect(() => decodeCursor("not-valid-json")).toThrow();
		});
	});
});
