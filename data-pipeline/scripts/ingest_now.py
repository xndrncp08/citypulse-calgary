#!/usr/bin/env python3
"""
Manual one-shot ingestion script.
Usage: python scripts/ingest_now.py [all|traffic|weather|bikes]
"""
import sys
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)

logger = structlog.get_logger()

target = sys.argv[1] if len(sys.argv) > 1 else "all"

if target in ("all", "traffic"):
    from ingestion.traffic import ingest_traffic_incidents, ingest_road_closures
    ingest_traffic_incidents()
    try:
        ingest_road_closures()
    except Exception as e:
        logger.warning("road closures skipped (URL may be unavailable)", error=str(e))

if target in ("all", "weather"):
    from ingestion.environment import ingest_weather, ingest_air_quality
    try:
        ingest_weather()
    except Exception as e:
        logger.warning("weather ingestion failed", error=str(e))
    try:
        ingest_air_quality()
    except Exception as e:
        logger.warning("air quality ingestion failed", error=str(e))

if target in ("all", "bikes"):
    from ingestion.bikes import ingest_bike_counters
    try:
        ingest_bike_counters()
    except Exception as e:
        logger.warning("bikes ingestion failed", error=str(e))

logger.info("ingestion complete", target=target)
