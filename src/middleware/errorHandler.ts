import { Request, Response, NextFunction } from "express";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
	if (error instanceof Error) {
		res.status(400).json({
			error: error.message,
		});

		return;
	}

	console.error(error);

	res.status(500).json({
		error: "Internal server error",
	});
}
