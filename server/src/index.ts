import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes"
import roomsRouter from "./routes/rooms.routes"
import usersRouter from "./routes/users.routes"
import uploadRouter from "./routes/upload.routes"
import { initSocket } from "./socket"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map(s => s.trim());
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    // В dev-режиме разрешаем любой origin, в проде — только из списка
    origin: isDev ? true : allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/users', usersRouter)
app.use('/api/upload', uploadRouter)

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const httpServer = initSocket(app)

httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
})
