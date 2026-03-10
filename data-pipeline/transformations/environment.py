"""
Normalize raw Environment Canada weather and air quality records.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

_DT_FORMATS = [
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d",
]


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in _DT_FORMATS:
        try:
            return datetime.strptime(str(value)[:19], fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_weather(raw: dict) -> dict | None:
    """
    Normalize a raw Environment Canada climate-hourly feature to DB schema.
    """
    props = raw.get("properties", raw)  # handle both GeoJSON feature and flat dict

    timestamp = _parse_dt(
        props.get("LOCAL_DATE")
        or props.get("date")
        or props.get("timestamp")
    )
    if not timestamp:
        return None

    return {
        "timestamp": timestamp,
        "temperature": _safe_float(props.get("TEMP") or props.get("temperature")),
        "wind_speed": _safe_float(props.get("WIND_SPEED") or props.get("wind_speed")),
        "precipitation": _safe_float(
            props.get("TOTAL_RAIN")
            or props.get("TOTAL_SNOW")
            or props.get("precipitation")
        ),
        "humidity": _safe_float(props.get("REL_HUM") or props.get("humidity")),
    }


def normalize_air_quality(raw: dict) -> dict | None:
    """
    Normalize a raw Environment Canada AQHI feature to DB schema.
    """
    props = raw.get("properties", raw)
    geom = raw.get("geometry") or {}
    coords = geom.get("coordinates", [None, None])

    timestamp = _parse_dt(
        props.get("DATE_TIME")
        or props.get("date")
        or props.get("timestamp")
    )
    aqhi = _safe_float(props.get("AQHI") or props.get("aqhi"))

    if not timestamp or aqhi is None:
        return None

    station = (
        props.get("STATION_NAME_E")
        or props.get("station_name")
        or props.get("STATION_NAME")
        or "Unknown"
    )

    lat = _safe_float(coords[1] if len(coords) > 1 else None) or 51.0447
    lng = _safe_float(coords[0] if coords else None) or -114.0719

    return {
        "timestamp": timestamp,
        "aqhi": aqhi,
        "station_name": station,
        "latitude": lat,
        "longitude": lng,
    }
