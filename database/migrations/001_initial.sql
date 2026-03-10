-- Initial schema migration for CityPulse Calgary
-- This is applied automatically by Prisma. This file is for reference only.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Traffic incidents
CREATE TABLE IF NOT EXISTS traffic_incidents (
    id                   TEXT PRIMARY KEY,
    incident_id          TEXT UNIQUE NOT NULL,
    description          TEXT,
    latitude             DOUBLE PRECISION NOT NULL,
    longitude            DOUBLE PRECISION NOT NULL,
    incident_type        TEXT NOT NULL,
    start_time           TIMESTAMPTZ NOT NULL,
    end_time             TIMESTAMPTZ,
    location_description TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_latlong ON traffic_incidents (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_traffic_start ON traffic_incidents (start_time);
CREATE INDEX IF NOT EXISTS idx_traffic_type ON traffic_incidents (incident_type);

-- Road closures
CREATE TABLE IF NOT EXISTS road_closures (
    id             TEXT PRIMARY KEY,
    closure_id     TEXT UNIQUE NOT NULL,
    road_name      TEXT NOT NULL,
    latitude       DOUBLE PRECISION NOT NULL,
    longitude      DOUBLE PRECISION NOT NULL,
    closure_start  TIMESTAMPTZ NOT NULL,
    closure_end    TIMESTAMPTZ,
    closure_reason TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_closure_latlong ON road_closures (latitude, longitude);

-- Bike counters
CREATE TABLE IF NOT EXISTS bike_counters (
    id            TEXT PRIMARY KEY,
    counter_id    TEXT UNIQUE NOT NULL,
    location_name TEXT NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bike_readings (
    id         TEXT PRIMARY KEY,
    counter_id TEXT NOT NULL REFERENCES bike_counters(id) ON DELETE CASCADE,
    date       TIMESTAMPTZ NOT NULL,
    bike_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (counter_id, date)
);

CREATE INDEX IF NOT EXISTS idx_bike_readings_date ON bike_readings (date);

-- Transit
CREATE TABLE IF NOT EXISTS transit_routes (
    id         TEXT PRIMARY KEY,
    route_id   TEXT UNIQUE NOT NULL,
    route_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_stops (
    id         TEXT PRIMARY KEY,
    stop_id    TEXT UNIQUE NOT NULL,
    stop_name  TEXT NOT NULL,
    latitude   DOUBLE PRECISION NOT NULL,
    longitude  DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stops_latlong ON transit_stops (latitude, longitude);

CREATE TABLE IF NOT EXISTS transit_trips (
    id         TEXT PRIMARY KEY,
    trip_id    TEXT UNIQUE NOT NULL,
    route_id   TEXT NOT NULL REFERENCES transit_routes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transit_stop_times (
    id             TEXT PRIMARY KEY,
    trip_id        TEXT NOT NULL REFERENCES transit_trips(id) ON DELETE CASCADE,
    stop_id        TEXT NOT NULL REFERENCES transit_stops(id) ON DELETE CASCADE,
    arrival_time   TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    stop_sequence  INTEGER NOT NULL,
    UNIQUE (trip_id, stop_id, stop_sequence)
);

-- Weather
CREATE TABLE IF NOT EXISTS weather_readings (
    id            TEXT PRIMARY KEY,
    timestamp     TIMESTAMPTZ UNIQUE NOT NULL,
    temperature   DOUBLE PRECISION,
    wind_speed    DOUBLE PRECISION,
    precipitation DOUBLE PRECISION,
    humidity      DOUBLE PRECISION,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_ts ON weather_readings (timestamp);

-- Air quality
CREATE TABLE IF NOT EXISTS air_quality_readings (
    id           TEXT PRIMARY KEY,
    timestamp    TIMESTAMPTZ NOT NULL,
    aqhi         DOUBLE PRECISION NOT NULL,
    station_name TEXT NOT NULL,
    latitude     DOUBLE PRECISION NOT NULL,
    longitude    DOUBLE PRECISION NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (timestamp, station_name)
);

CREATE INDEX IF NOT EXISTS idx_aq_ts ON air_quality_readings (timestamp);
CREATE INDEX IF NOT EXISTS idx_aq_latlong ON air_quality_readings (latitude, longitude);
