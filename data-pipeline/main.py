"""
CityPulse Calgary — Data Pipeline
Runs scheduled ingestion from public APIs into PostgreSQL.
"""
import sys
import structlog
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config.settings import settings
from jobs.scheduler import run_all_jobs, run_traffic_job, run_weather_job

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger(__name__)


def main() -> None:
    logger.info(
        "starting citypulse data pipeline",
        interval_minutes=settings.pipeline_interval_minutes,
    )

    # Initial seed on startup
    logger.info("running initial data load")
    run_all_jobs()
    logger.info("initial data load complete")

    scheduler = BlockingScheduler()

    # Traffic updates every interval (30-60 min)
    scheduler.add_job(
        run_traffic_job,
        trigger=IntervalTrigger(minutes=settings.pipeline_interval_minutes),
        id="traffic",
        name="Traffic Incidents",
        max_instances=1,
        coalesce=True,
    )

    # Weather every 15 minutes (more time-sensitive)
    scheduler.add_job(
        run_weather_job,
        trigger=IntervalTrigger(minutes=15),
        id="weather",
        name="Weather & Air Quality",
        max_instances=1,
        coalesce=True,
    )

    try:
        logger.info("scheduler started")
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("pipeline shutting down")
        sys.exit(0)


if __name__ == "__main__":
    main()
