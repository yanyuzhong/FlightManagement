import { Request, Response, NextFunction } from "express";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
	if (error instanceof Error && error.message === "Invalid cursor") {
		res.status(400).json({
			error: "Invalid cursor",
		});

		return;
	}

	console.error(error);

	res.status(500).json({
		error: "Internal server error",
	});
}
