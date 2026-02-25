import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes"
import roomsRouter from "./routes/rooms.routes"
import usersRouter from "./routes/users.routes"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/users', usersRouter)

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
})
