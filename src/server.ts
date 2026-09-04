import "dotenv/config";

import app from "./app.js";
import { connectToDatabase } from "./config/database.js";

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
	await connectToDatabase();

	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}`);
	});
}

startServer().catch((error) => {
	console.error("Failed to start server:", error);
	process.exit(1);
});
