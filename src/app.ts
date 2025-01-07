import express from "express";
import routes from "./routes/index";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
    cors({
        origin: "*", // Allow requests from this frontend origin
        methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
        credentials: true, // Allow cookies or other credentials
    })
);

// Middleware
app.use(express.json());

// Routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

export default app;
