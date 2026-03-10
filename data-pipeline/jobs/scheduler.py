"""
APScheduler job definitions for periodic data ingestion.
"""
import structlog
from ingestion.traffic import ingest_traffic_incidents, ingest_road_closures
from ingestion.environment import ingest_weather, ingest_air_quality
from ingestion.bikes import ingest_bike_counters
from ingestion.transit import ingest_gtfs

logger = structlog.get_logger(__name__)


def run_traffic_job() -> None:
    logger.info("starting traffic ingestion job")
    try:
        count = ingest_traffic_incidents()
        logger.info("traffic job complete", incidents=count)
    except Exception as exc:
        logger.error("traffic job failed", error=str(exc))


def run_road_closures_job() -> None:
    logger.info("starting road closures job")
    try:
        count = ingest_road_closures()
        logger.info("road closures job complete", closures=count)
    except Exception as exc:
        logger.error("road closures job failed", error=str(exc))


def run_weather_job() -> None:
    logger.info("starting weather ingestion job")
    try:
        w = ingest_weather()
        aq = ingest_air_quality()
        logger.info("weather job complete", weather=w, air_quality=aq)
    except Exception as exc:
        logger.error("weather job failed", error=str(exc))


def run_bikes_job() -> None:
    logger.info("starting bikes ingestion job")
    try:
        count = ingest_bike_counters()
        logger.info("bikes job complete", counters=count)
    except Exception as exc:
        logger.error("bikes job failed", error=str(exc))


def run_gtfs_job() -> None:
    logger.info("starting GTFS ingestion job")
    try:
        counts = ingest_gtfs()
        logger.info("GTFS job complete", **counts)
    except Exception as exc:
        logger.error("GTFS job failed", error=str(exc))


def run_all_jobs() -> None:
    """Run all ingestion jobs once (for initial seed)."""
    run_traffic_job()
    run_road_closures_job()
    run_weather_job()
    run_bikes_job()
    run_gtfs_job()
