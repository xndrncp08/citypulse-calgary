"""
Normalize raw Socrata traffic incident records.
"""
from __future__ import annotations
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger(__name__)

_DT_FORMATS = [
    "%Y-%m-%dT%H:%M:%S.%f",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
]


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in _DT_FORMATS:
        try:
            dt = datetime.strptime(value.split("+")[0].strip(), fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _parse_float(value: str | float | None) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_incident(raw: dict) -> dict | None:
    """
    Map a raw Socrata traffic incident to the DB schema.
    Returns None if required fields are missing.
    """
    incident_id = (
        raw.get("id")
        or raw.get("incident_id")
        or raw.get("globalid")
    )
    if not incident_id:
        return None

    latitude = _parse_float(
        raw.get("latitude")
        or (raw.get("point") or {}).get("coordinates", [None, None])[1]
    )
    longitude = _parse_float(
        raw.get("longitude")
        or (raw.get("point") or {}).get("coordinates", [None, None])[0]
    )

    if latitude is None or longitude is None:
        return None

    start_time = _parse_dt(raw.get("start_dt") or raw.get("start_time") or raw.get("startdt"))
    if start_time is None:
        start_time = datetime.now(timezone.utc)

    return {
        "incident_id": str(incident_id),
        "description": raw.get("description") or raw.get("incident_info"),
        "latitude": latitude,
        "longitude": longitude,
        "incident_type": (raw.get("incident_type") or raw.get("type") or "UNKNOWN").upper(),
        "start_time": start_time,
        "end_time": _parse_dt(raw.get("end_dt") or raw.get("end_time")),
        "location_description": raw.get("quadrant") or raw.get("location") or raw.get("road"),
    }
