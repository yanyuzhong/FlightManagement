# FlightManagement

A backend system to manage flight logs for an airline's fleet.
Supports the following APIs:

```
GET /api/v1/flights (sort by latest departureTime by default)
GET /api/v1/flights/aircraft/:aircraftId
GET /api/v1/flights/total-hours
```

## Setup

### 1. Clone the repository

```
git clone https://github.com/yanyuzhong/FlightManagement.git
```

### 2. Install dependencies

```
cd FlightManagement
npm install
```

### 3. Configure environment variables

Create a cluster and database in [MongoDB Atlas](https://cloud.mongodb.com/). When connecting to the cluster, select `Drivers` and note down the `connection string`, `cluster name`, and `db name`.

![MongoDB](/demo/mongodb%20cluster.jpg)

Create `.env` from `.env.example`. And update the environment variables with the ones above.

```env
MONGODB_URI=mongodb+srv://<userId>:<password>@<cluster>/<dbName>?appName=<clusterName>
PORT=3000
DB_NAME=flightManagementDB
COLL_NAME=flightLogs
```

### 4. Populate data

Populate 10,000 documents to your MongoDB database.

```
cd FlightManagement
npm run generate-data
```

### 4. Run the development server

```
npm run dev
```

The API is available at:

`http://localhost:3000`

### 5. Download the Postman Collection

Download the postman collection located at `demo\FlightManagement.postman_collection.json`. Import it to your local postman and start testing.

## Demo

See demo video in `demo\FlightManagemet - Demo Video.mp4`

## Design Decisions

### Indexing Strategy

There're 3 different indexes created, each to accomodate one API requirement.

- for GET /flights,
  `{
  departureTime: -1,
  _id: -1
}`
  is added to support efficient sorting by departureTime (in descending order, where we get the latest flights by default; but can also support ascending order).

  `_id: -1` is added to gaurantee unique ordering as multiple flights can have the same timestamp.

- for GET /flights/aircraft/:aircraftId,
  `{
aircraftId: 1,
	status: 1,
	departureTime: -1,
}`
  is added. The primary access pattern for this API is to filter by aircraftId first and optionally filter by status, and we'll return the latest departure first. Hence `aircraftId` is the first field added, followed by a further filtering on `status`, and finally `departureTime` to support sorting the requests in descending order.

- for GET /flights/total-hours,
  `  {
status: 1,
	departureTime: 1,
}`
  is added. We want to filter the flights with status="landed" before doing any aggregation, hence the primary field for the index is `status`. We also need to filter the flights by a start date and end date. For this implementation I've decided to use departureTime to determine whether a flight falls within the required time frame. And `departureTime` is added to the index to support efficiently querying and comparing flights by `departureTime`.

### Pagination Strategy

Cursor-based pagination is used since it can better accomodate data at large scale and increasing growing data set. It is more stable when new flights are inserted compare to offset-based pagination. As insertion can shift the documents that belong to later pages. Offset-based pagination may duplicate/skip documents.

The cursor used is in the following format
`{
  departureTime, id
}`. In descending order, we find the first item where item.departureTime <= cursor.departureTime (optionally item.id < cursor.id for deduplication), and then return the next set of items.

### Compatibility with Future Enhancements

- API versioning is added under `src/routes`. If we want to introduce breaking change, we can add a separate API version under `src/routes/v2` without changing existing behavior of clients using `src/routes/v1`.
- We can easily add new indexes with new query patterns in `src/models/flightLog.ts`. One caveat is that when we add new ones, we need to make sure those are needed as adding more indexes require additional disk/storage space, increase memory usage and more index maintenance.
