import express from "express";
import cors from "cors";
import employeesRouter from "./routes/employees.js";
import timeRouter from "./routes/time.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/employees", employeesRouter);
app.use("/api/time", timeRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));