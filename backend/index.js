import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name of the current module file
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Placeholder for the parsed CSV data
let crashData = [];

// Read and parse the CSV file
const csvFilePath = path.join(__dirname, "listings.csv");
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => crashData.push(row))
  .on("end", () => {
    console.log("CSV file successfully processed");
    console.log(`Loaded ${crashData.length} rows from the CSV.`);
  });

app.use(
  cors({
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
  })
);

// Endpoint to send the parsed CSV data
app.get("/data", (req, res) => {
  //   let filteredData = crashData.filter((row) => {
  //     const rowYear = new Date(row.DateTime).getFullYear();
  //     return rowYear === 2023;
  //   });

  res.status(200).send(crashData);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`server listening on port ${port} 🚀`));
