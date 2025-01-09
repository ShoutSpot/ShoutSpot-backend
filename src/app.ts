import express from "express";
import routes from "./routes/index";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

app.use(express.json());

app.use("/api", routes);

app.use(errorHandler);

export default app;
