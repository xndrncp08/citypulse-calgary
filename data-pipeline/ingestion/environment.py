"""
Ingest weather and air quality data.
- Weather: Open-Meteo (free, no API key, accurate for Calgary)
- Air quality: Environment Canada AQHI for Calgary
"""
from __future__ import annotations
from datetime import datetime, timezone
import structlog
from config.database import db_cursor
from ingestion.base import fetch_json

logger = structlog.get_logger(__name__)

# Calgary coordinates
CALGARY_LAT = 51.0447
CALGARY_LNG = -114.0719

WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=51.0447&longitude=-114.0719"
    "&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
    "&timezone=America%2FDenver&past_days=2&forecast_days=1"
)

# Environment Canada AQHI for Alberta (location_id 06)
AQHI_URL = (
    "https://api.weather.gc.ca/collections/aqhi-observations-realtime/items"
    "?f=json&limit=100&community=Calgary"
)


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def ingest_weather() -> int:
    """Ingest hourly weather from Open-Meteo for Calgary."""
    try:
        payload = fetch_json(WEATHER_URL)
    except Exception as exc:
        logger.error("failed to fetch weather data", error=str(exc))
        return 0

    hourly = payload.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    humidity = hourly.get("relative_humidity_2m", [])
    precip = hourly.get("precipitation", [])
    wind = hourly.get("wind_speed_10m", [])

    upserted = 0
    with db_cursor() as cur:
        for i, t in enumerate(times):
            timestamp = _parse_dt(t)
            if not timestamp:
                continue
            try:
                cur.execute(
                    """
                    INSERT INTO weather_readings
                        (id, timestamp, temperature, wind_speed, precipitation, humidity, created_at)
                    VALUES
                        (gen_random_uuid(), %(timestamp)s, %(temperature)s,
                         %(wind_speed)s, %(precipitation)s, %(humidity)s, NOW())
                    ON CONFLICT (timestamp) DO UPDATE SET
                        temperature  = EXCLUDED.temperature,
                        wind_speed   = EXCLUDED.wind_speed,
                        precipitation = EXCLUDED.precipitation,
                        humidity     = EXCLUDED.humidity
                    """,
                    {
                        "timestamp":    timestamp,
                        "temperature":  temps[i]    if i < len(temps)    else None,
                        "wind_speed":   wind[i]     if i < len(wind)     else None,
                        "precipitation": precip[i]  if i < len(precip)   else None,
                        "humidity":     humidity[i] if i < len(humidity) else None,
                    },
                )
                upserted += 1
            except Exception as exc:
                logger.warning("skipping weather record", error=str(exc))

    logger.info("upserted weather readings", count=upserted)
    return upserted


def ingest_air_quality() -> int:
    """Ingest AQHI from Environment Canada for Calgary."""
    try:
        payload = fetch_json(AQHI_URL)
    except Exception as exc:
        logger.error("failed to fetch air quality data", error=str(exc))
        return 0

    features = payload.get("features", []) if isinstance(payload, dict) else []
    upserted = 0

    with db_cursor() as cur:
        for feature in features:
            props = feature.get("properties", {})
            geom  = feature.get("geometry") or {}
            coords = geom.get("coordinates", [None, None])

            timestamp = _parse_dt(props.get("DATE_TIME") or props.get("date"))
            aqhi      = props.get("AQHI") or props.get("aqhi")
            station   = props.get("STATION_NAME_E") or props.get("community", "Calgary")

            if not timestamp or aqhi is None:
                continue

            try:
                cur.execute(
                    """
                    INSERT INTO air_quality_readings
                        (id, timestamp, aqhi, station_name, latitude, longitude, created_at)
                    VALUES
                        (gen_random_uuid(), %(timestamp)s, %(aqhi)s,
                         %(station_name)s, %(latitude)s, %(longitude)s, NOW())
                    ON CONFLICT (timestamp, station_name) DO UPDATE SET
                        aqhi = EXCLUDED.aqhi
                    """,
                    {
                        "timestamp":    timestamp,
                        "aqhi":         float(aqhi),
                        "station_name": station,
                        "latitude":     float(coords[1]) if len(coords) > 1 and coords[1] else CALGARY_LAT,
                        "longitude":    float(coords[0]) if coords[0] else CALGARY_LNG,
                    },
                )
                upserted += 1
            except Exception as exc:
                logger.warning("skipping air quality record", error=str(exc))

    logger.info("upserted air quality readings", count=upserted)
    return upserted