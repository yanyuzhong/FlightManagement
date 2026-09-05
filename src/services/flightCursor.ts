export interface FlightCursor {
	departureTime: string;
	id: string;
}

export function encodeCursor(cursor: FlightCursor): string {
	return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(cursor: string): FlightCursor {
	const decoded = Buffer.from(cursor, "base64url").toString("utf8");

	const parsed: unknown = JSON.parse(decoded);

	if (typeof parsed !== "object" || parsed === null || !("departureTime" in parsed) || !("id" in parsed)) {
		throw new Error("Invalid cursor");
	}

	const data = parsed as {
		departureTime: unknown;
		id: unknown;
	};

	if (typeof data.departureTime !== "string" || typeof data.id !== "string") {
		throw new Error("Invalid cursor");
	}

	if (Number.isNaN(new Date(data.departureTime).getTime())) {
		throw new Error("Invalid cursor");
	}

	return {
		departureTime: data.departureTime,
		id: data.id,
	};
}
