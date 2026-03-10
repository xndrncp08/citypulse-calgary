"""
Normalize raw bike counter records from City of Calgary Open Data.
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any


def _safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_int(value: Any) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(str(value)[:10], fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def normalize_bike_counter(raw: dict) -> dict | None:
    """
    Normalize a raw Socrata bike counter record.
    Returns a tuple (counter_dict, reading_dict | None).
    """
    counter_id = str(
        raw.get("counter_id")
        or raw.get("site_id")
        or raw.get("id")
        or ""
    )
    if not counter_id:
        return None

    lat = _safe_float(raw.get("latitude"))
    lng = _safe_float(raw.get("longitude"))
    if lat is None or lng is None:
        return None

    location_name = (
        raw.get("location_name")
        or raw.get("name")
        or raw.get("site_name")
        or f"Counter {counter_id}"
    )

    date = _parse_date(raw.get("date") or raw.get("count_date"))
    bike_count = _safe_int(
        raw.get("bike_count") or raw.get("volume") or raw.get("count")
    )

    return {
        "counter_id": counter_id,
        "location_name": location_name,
        "latitude": lat,
        "longitude": lng,
        "date": date,
        "bike_count": bike_count,
    }
