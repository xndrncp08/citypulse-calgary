"""
Ingest weather and air quality data from Environment Canada.
"""
from __future__ import annotations
from datetime import datetime, timezone
import structlog
from config.settings import settings
from config.database import db_cursor
from ingestion.base import fetch_json

logger = structlog.get_logger(__name__)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def ingest_weather() -> int:
    """Ingest hourly weather observations from Environment Canada."""
    try:
        payload = fetch_json(settings.weather_url)
    except Exception as exc:
        logger.error("failed to fetch weather data", error=str(exc))
        return 0

    features = payload.get("features", []) if isinstance(payload, dict) else []
    upserted = 0

    with db_cursor() as cur:
        for feature in features:
            props = feature.get("properties", {})
            timestamp = _parse_dt(props.get("LOCAL_DATE") or props.get("date"))
            if not timestamp:
                continue

            try:
                cur.execute(
                    """
                    INSERT INTO weather_readings
                        (id, timestamp, temperature, wind_speed, precipitation,
                         humidity, created_at)
                    VALUES
                        (gen_random_uuid(), %(timestamp)s, %(temperature)s,
                         %(wind_speed)s, %(precipitation)s, %(humidity)s, NOW())
                    ON CONFLICT (timestamp) DO NOTHING
                    """,
                    {
                        "timestamp": timestamp,
                        "temperature": props.get("TEMP") or props.get("temperature"),
                        "wind_speed": props.get("WIND_SPEED") or props.get("wind_speed"),
                        "precipitation": props.get("TOTAL_RAIN") or props.get("precipitation"),
                        "humidity": props.get("REL_HUM") or props.get("humidity"),
                    },
                )
                upserted += 1
            except Exception as exc:
                logger.warning("skipping weather record", error=str(exc))

    logger.info("upserted weather readings", count=upserted)
    return upserted


def ingest_air_quality() -> int:
    """Ingest AQHI readings from Environment Canada."""
    try:
        payload = fetch_json(settings.air_quality_url)
    except Exception as exc:
        logger.error("failed to fetch air quality data", error=str(exc))
        return 0

    features = payload.get("features", []) if isinstance(payload, dict) else []
    upserted = 0

    with db_cursor() as cur:
        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry") or {}
            coords = geom.get("coordinates", [None, None])

            timestamp = _parse_dt(props.get("DATE_TIME") or props.get("date"))
            aqhi = props.get("AQHI") or props.get("aqhi")
            station = props.get("STATION_NAME_E") or props.get("station_name", "Unknown")

            if not timestamp or aqhi is None:
                continue

            try:
                cur.execute(
                    """
                    INSERT INTO air_quality_readings
                        (id, timestamp, aqhi, station_name, latitude,
                         longitude, created_at)
                    VALUES
                        (gen_random_uuid(), %(timestamp)s, %(aqhi)s,
                         %(station_name)s, %(latitude)s, %(longitude)s, NOW())
                    ON CONFLICT (timestamp, station_name) DO NOTHING
                    """,
                    {
                        "timestamp": timestamp,
                        "aqhi": float(aqhi),
                        "station_name": station,
                        "latitude": float(coords[1]) if len(coords) > 1 and coords[1] else 51.0447,
                        "longitude": float(coords[0]) if coords[0] else -114.0719,
                    },
                )
                upserted += 1
            except Exception as exc:
                logger.warning("skipping air quality record", error=str(exc))

    logger.info("upserted air quality readings", count=upserted)
    return upserted
