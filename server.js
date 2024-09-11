import express from "express";
import dotenv from "dotenv";
import { dbConnection } from "./Database/dbConnection.js";

import authRoutes from "./Authentication/Auth.js"; 
import bodyParser from "body-parser";

const app = express();
dotenv.config();


dbConnection();

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("hello");
});


app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server has started at port ${PORT}`);
});
