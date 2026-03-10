import "dotenv/config";
import app from "./app";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.listen(PORT, () => {
  logger.info(`CityPulse backend listening on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error });
  process.exit(1);
});
