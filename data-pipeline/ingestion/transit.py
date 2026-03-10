"""
Ingest Calgary Transit GTFS feed — routes, stops, trips, and stop times.
Downloads and parses the GTFS zip from the Calgary Open Data Portal.
"""
from __future__ import annotations
import io
import zipfile
import csv
import tempfile
import os
import structlog
import httpx
from config.settings import settings
from config.database import db_cursor

logger = structlog.get_logger(__name__)


def _download_gtfs(url: str) -> bytes:
    logger.info("downloading GTFS feed", url=url)
    with httpx.Client(timeout=60) as client:
        response = client.get(url, follow_redirects=True)
        response.raise_for_status()
    return response.content


def _parse_csv_from_zip(zf: zipfile.ZipFile, filename: str) -> list[dict]:
    """Read a CSV file from inside a zip archive."""
    try:
        with zf.open(filename) as f:
            reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))
            return list(reader)
    except KeyError:
        logger.warning("file not found in GTFS zip", filename=filename)
        return []


def ingest_gtfs() -> dict[str, int]:
    """
    Download and ingest the GTFS feed.
    Returns counts of records inserted per table.
    """
    try:
        content = _download_gtfs(settings.gtfs_url)
    except Exception as exc:
        logger.error("failed to download GTFS feed", error=str(exc))
        return {}

    counts: dict[str, int] = {}

    with zipfile.ZipFile(io.BytesIO(content)) as zf:
        # ── Routes ──────────────────────────────────────────────────────────
        routes = _parse_csv_from_zip(zf, "routes.txt")
        route_count = 0
        with db_cursor() as cur:
            for row in routes:
                route_id = row.get("route_id", "").strip()
                route_name = (
                    row.get("route_long_name")
                    or row.get("route_short_name")
                    or route_id
                ).strip()
                if not route_id:
                    continue
                try:
                    cur.execute(
                        """
                        INSERT INTO transit_routes (id, route_id, route_name, created_at, updated_at)
                        VALUES (gen_random_uuid(), %(route_id)s, %(route_name)s, NOW(), NOW())
                        ON CONFLICT (route_id) DO UPDATE SET route_name = EXCLUDED.route_name, updated_at = NOW()
                        """,
                        {"route_id": route_id, "route_name": route_name},
                    )
                    route_count += 1
                except Exception as exc:
                    logger.warning("skipping route", error=str(exc), route_id=route_id)
        counts["routes"] = route_count
        logger.info("upserted routes", count=route_count)

        # ── Stops ───────────────────────────────────────────────────────────
        stops = _parse_csv_from_zip(zf, "stops.txt")
        stop_count = 0
        with db_cursor() as cur:
            for row in stops:
                stop_id = row.get("stop_id", "").strip()
                stop_name = row.get("stop_name", "").strip()
                try:
                    lat = float(row.get("stop_lat") or 0)
                    lng = float(row.get("stop_lon") or 0)
                except (TypeError, ValueError):
                    continue
                if not stop_id or lat == 0:
                    continue
                try:
                    cur.execute(
                        """
                        INSERT INTO transit_stops
                            (id, stop_id, stop_name, latitude, longitude, created_at, updated_at)
                        VALUES
                            (gen_random_uuid(), %(stop_id)s, %(stop_name)s,
                             %(latitude)s, %(longitude)s, NOW(), NOW())
                        ON CONFLICT (stop_id) DO UPDATE SET
                            stop_name = EXCLUDED.stop_name,
                            latitude  = EXCLUDED.latitude,
                            longitude = EXCLUDED.longitude,
                            updated_at = NOW()
                        """,
                        {"stop_id": stop_id, "stop_name": stop_name, "latitude": lat, "longitude": lng},
                    )
                    stop_count += 1
                except Exception as exc:
                    logger.warning("skipping stop", error=str(exc), stop_id=stop_id)
        counts["stops"] = stop_count
        logger.info("upserted stops", count=stop_count)

        # ── Trips ───────────────────────────────────────────────────────────
        trips = _parse_csv_from_zip(zf, "trips.txt")
        trip_count = 0
        with db_cursor() as cur:
            # Build route_id → internal id map
            cur.execute("SELECT id, route_id FROM transit_routes")
            route_map = {row["route_id"]: row["id"] for row in cur.fetchall()}

            for row in trips[:5000]:  # cap for performance in dev
                trip_id = row.get("trip_id", "").strip()
                route_id = row.get("route_id", "").strip()
                internal_route_id = route_map.get(route_id)
                if not trip_id or not internal_route_id:
                    continue
                try:
                    cur.execute(
                        """
                        INSERT INTO transit_trips (id, trip_id, route_id, created_at)
                        VALUES (gen_random_uuid(), %(trip_id)s, %(route_id)s, NOW())
                        ON CONFLICT (trip_id) DO NOTHING
                        """,
                        {"trip_id": trip_id, "route_id": internal_route_id},
                    )
                    trip_count += 1
                except Exception as exc:
                    logger.warning("skipping trip", error=str(exc))
        counts["trips"] = trip_count
        logger.info("upserted trips", count=trip_count)

    return counts
