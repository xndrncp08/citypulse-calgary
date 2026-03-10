"""
Ingest traffic incidents from the City of Calgary Open Data Portal.
"""
from __future__ import annotations
import structlog
from config.settings import settings
from config.database import db_cursor
from ingestion.base import fetch_socrata
from transformations.traffic import normalize_incident

logger = structlog.get_logger(__name__)


def ingest_traffic_incidents() -> int:
    """
    Fetch and upsert traffic incidents.
    Returns the number of records processed.
    """
    raw = fetch_socrata(settings.traffic_incidents_url)
    normalized = [normalize_incident(r) for r in raw if r]
    normalized = [n for n in normalized if n is not None]

    if not normalized:
        logger.warning("no valid traffic incidents to insert")
        return 0

    upserted = 0
    with db_cursor() as cur:
        for record in normalized:
            cur.execute(
                """
                INSERT INTO traffic_incidents
                    (id, incident_id, description, latitude, longitude,
                     incident_type, start_time, end_time, location_description,
                     created_at, updated_at)
                VALUES
                    (gen_random_uuid(), %(incident_id)s, %(description)s,
                     %(latitude)s, %(longitude)s, %(incident_type)s,
                     %(start_time)s, %(end_time)s, %(location_description)s,
                     NOW(), NOW())
                ON CONFLICT (incident_id) DO UPDATE SET
                    description        = EXCLUDED.description,
                    end_time           = EXCLUDED.end_time,
                    updated_at         = NOW()
                """,
                record,
            )
            upserted += 1

    logger.info("upserted traffic incidents", count=upserted)
    return upserted


def ingest_road_closures() -> int:
    """Fetch and upsert road closure data."""
    raw = fetch_socrata(settings.road_closures_url)

    upserted = 0
    with db_cursor() as cur:
        for record in raw:
            try:
                cur.execute(
                    """
                    INSERT INTO road_closures
                        (id, closure_id, road_name, latitude, longitude,
                         closure_start, closure_end, closure_reason,
                         created_at, updated_at)
                    VALUES
                        (gen_random_uuid(), %(closure_id)s, %(road_name)s,
                         %(latitude)s, %(longitude)s, %(closure_start)s,
                         %(closure_end)s, %(closure_reason)s, NOW(), NOW())
                    ON CONFLICT (closure_id) DO UPDATE SET
                        closure_end    = EXCLUDED.closure_end,
                        updated_at     = NOW()
                    """,
                    {
                        "closure_id": record.get("id") or record.get("closure_id"),
                        "road_name": record.get("road_name") or record.get("description", ""),
                        "latitude": float(record.get("latitude") or record.get("point", {}).get("coordinates", [0, 0])[1] or 0),
                        "longitude": float(record.get("longitude") or record.get("point", {}).get("coordinates", [0, 0])[0] or 0),
                        "closure_start": record.get("start_date") or record.get("effective_from"),
                        "closure_end": record.get("end_date") or record.get("effective_to"),
                        "closure_reason": record.get("description") or record.get("reason"),
                    },
                )
                upserted += 1
            except Exception as exc:
                logger.warning("skipping road closure record", error=str(exc))

    logger.info("upserted road closures", count=upserted)
    return upserted
