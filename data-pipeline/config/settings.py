from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://citypulse:citypulse_dev@localhost:5432/citypulse"
    pipeline_interval_minutes: int = 30

    # Calgary Open Data endpoints
    traffic_incidents_url: str = "https://data.calgary.ca/resource/35ra-9556.json"
    road_closures_url: str = "https://data.calgary.ca/resource/4n57-wmgk.json"
    bike_counters_url: str = "https://data.calgary.ca/resource/q8am-pz8j.json"
    gtfs_url: str = "https://data.calgary.ca/download/am7c-qe3u/application/zip"

    # Environment Canada
    weather_url: str = (
        "https://api.weather.gc.ca/collections/climate-hourly/items"
        "?f=json&limit=100&sortby=-LOCAL_DATE&CLIMATE_IDENTIFIER=3031093"
    )
    air_quality_url: str = (
        "https://api.weather.gc.ca/collections/aqhi-observations-realtime/items"
        "?f=json&limit=100&sortby=-DATE_TIME"
    )

    # Request timeouts
    request_timeout_seconds: int = 30
    socrata_page_size: int = 1000


settings = Settings()
