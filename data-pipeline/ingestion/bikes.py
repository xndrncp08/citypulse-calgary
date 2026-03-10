"""
Ingest bike counter data from the City of Calgary Open Data Portal.
"""
from __future__ import annotations
from datetime import datetime, timezone
import structlog
from config.settings import settings
from config.database import db_cursor
from ingestion.base import fetch_socrata

logger = structlog.get_logger(__name__)


def ingest_bike_counters() -> int:
    """Fetch bike counter locations and daily readings."""
    raw = fetch_socrata(settings.bike_counters_url)

    upserted_counters = 0
    upserted_readings = 0

    with db_cursor() as cur:
        for record in raw:
            counter_id = str(record.get("counter_id") or record.get("site_id") or record.get("id", ""))
            if not counter_id:
                continue

            location_name = record.get("location_name") or record.get("name") or record.get("site_name", "")
            try:
                lat = float(record.get("latitude") or 51.0447)
                lng = float(record.get("longitude") or -114.0719)
            except (TypeError, ValueError):
                continue

            # Upsert counter
            cur.execute(
                """
                INSERT INTO bike_counters
                    (id, counter_id, location_name, latitude, longitude,
                     created_at, updated_at)
                VALUES
                    (gen_random_uuid(), %(counter_id)s, %(location_name)s,
                     %(latitude)s, %(longitude)s, NOW(), NOW())
                ON CONFLICT (counter_id) DO UPDATE SET
                    location_name = EXCLUDED.location_name,
                    updated_at    = NOW()
                RETURNING id
                """,
                {"counter_id": counter_id, "location_name": location_name, "latitude": lat, "longitude": lng},
            )
            row = cur.fetchone()
            upserted_counters += 1

            if not row:
                continue

            # Upsert reading
            date_str = record.get("date") or record.get("count_date")
            bike_count = record.get("bike_count") or record.get("volume") or record.get("count")

            if date_str and bike_count is not None:
                try:
                    date = datetime.strptime(str(date_str)[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    cur.execute(
                        """
                        INSERT INTO bike_readings
                            (id, counter_id, date, bike_count, created_at)
                        VALUES
                            (gen_random_uuid(), %(counter_id)s, %(date)s, %(bike_count)s, NOW())
                        ON CONFLICT (counter_id, date) DO UPDATE SET
                            bike_count = EXCLUDED.bike_count
                        """,
                        {"counter_id": row["id"], "date": date, "bike_count": int(bike_count)},
                    )
                    upserted_readings += 1
                except Exception as exc:
                    logger.warning("skipping bike reading", error=str(exc))

    logger.info("upserted bike counters", counters=upserted_counters, readings=upserted_readings)
    return upserted_counters
