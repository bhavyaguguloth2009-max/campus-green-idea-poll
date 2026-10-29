require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const ideasRouter = require("./routes/ideas");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a little and try again." }
}));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Campus Green Ideas Board API" });
});
app.use("/api/ideas", ideasRouter);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("*splat", (req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API endpoint not found." });
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"), error => {
    if (error) next(error);
  });
});

app.use((err, req, res, next) => {
  console.error("Request failed:", err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "The server could not complete your request. Check the server terminal for details." });
});

app.listen(port, () => {
  console.log(`Campus Green Ideas Board is running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});
