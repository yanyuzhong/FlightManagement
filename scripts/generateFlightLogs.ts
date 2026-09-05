import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { faker } from "@faker-js/faker";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.DB_NAME ?? "";
const COLL_NAME = process.env.COLL_NAME ?? "";

const BATCH_SIZE = 1000;
const TOTAL_DOCUMENTS = 50;
const AIRCRAFT_COUNT = 50;
const STATUSES = ["scheduled", "departed", "landed", "canceled"];
const AIRCRAFT_IDS = Array.from({ length: AIRCRAFT_COUNT }, (_, index) => `R${index}`);

interface FlightLog {
	_id: ObjectId;
	aircraftId: string;
	arrivalAirport: string;
	arrivalTime: Date;
	departureAirport: string;
	departureTime: Date;
	durationMinutes: number;
	flightId: string;
	status: string;
}

function getRandomStatus(): string {
	const index = faker.number.int({
		min: 0,
		max: STATUSES.length - 1,
	});

	return STATUSES[index];
}

function getRandomAircraftId(): string {
	const index = faker.number.int({
		min: 0,
		max: AIRCRAFT_IDS.length - 1,
	});

	return AIRCRAFT_IDS[index];
}

function generateDocument(): FlightLog {
	const airline = faker.airline.airline();

	let departureAirport = faker.airline.airport();
	let arrivalAirport = faker.airline.airport();

	// Make sure departure and arrival airports are different
	while (arrivalAirport.iataCode === departureAirport.iataCode) {
		arrivalAirport = faker.airline.airport();
	}

	const flightNumber = faker.airline.flightNumber();

	const departureTime = faker.date.between({
		from: new Date(),
		to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	});

	const durationMinutes = faker.number.int({
		min: 30,
		max: 1200,
	});

	const arrivalTime = new Date(departureTime.getTime() + durationMinutes * 60 * 1000);

	return {
		_id: new ObjectId(),
		aircraftId: getRandomAircraftId(),
		arrivalAirport: arrivalAirport.iataCode,
		arrivalTime,
		departureAirport: departureAirport.iataCode,
		departureTime,
		durationMinutes,
		flightId: `${airline.iataCode}${flightNumber}`,
		status: getRandomStatus(),
	};
}

async function generateMockData(): Promise<void> {
	const client = new MongoClient(MONGODB_URI);

	try {
		await client.connect();

		const db = client.db(DB_NAME);
		const collection = db.collection<FlightLog>(COLL_NAME);

		const numBatches = Math.ceil(TOTAL_DOCUMENTS / BATCH_SIZE);

		console.log(`Starting mock data generation for ${DB_NAME}.${COLL_NAME}`);
		console.log(`Total documents to generate: ${TOTAL_DOCUMENTS} documents`);
		console.log(`Batch size: ${BATCH_SIZE} documents per batch`);

		const startTime = new Date();

		for (let batchStart = 0; batchStart < TOTAL_DOCUMENTS; batchStart += BATCH_SIZE) {
			const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_DOCUMENTS);

			const batchSize = batchEnd - batchStart;

			console.log(`Generating batch ${Math.floor(batchStart / BATCH_SIZE) + 1} of ${numBatches} (${batchSize} documents)...`);

			const batchDocuments: FlightLog[] = [];

			for (let i = 0; i < batchSize; i++) {
				batchDocuments.push(generateDocument());
			}

			await collection.insertMany(batchDocuments);

			console.log("Batch inserted successfully.");
		}

		const endTime = new Date();
		const duration = (endTime.getTime() - startTime.getTime()) / 1000;

		console.log("\n=== Mock Data Generation Complete ===");
		console.log(`Total time: ${duration.toFixed(2)} seconds`);
		console.log(`Collection: ${DB_NAME}.${COLL_NAME}`);
	} catch (error) {
		console.error("Failed to generate mock data:", error);
		process.exitCode = 1;
	} finally {
		await client.close();
	}
}

generateMockData();
