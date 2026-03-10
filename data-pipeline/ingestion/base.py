"""
Base HTTP fetching utilities shared by all ingestors.
"""
import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from config.settings import settings

logger = structlog.get_logger(__name__)


@retry(
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True,
)
def fetch_json(url: str, params: dict | None = None) -> list | dict:
    """Fetch JSON from a URL with retry logic."""
    logger.info("fetching", url=url)
    with httpx.Client(timeout=settings.request_timeout_seconds) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def fetch_socrata(base_url: str) -> list[dict]:
    """
    Paginate through a Socrata dataset and return all records.
    """
    records: list[dict] = []
    offset = 0
    limit = settings.socrata_page_size

    while True:
        batch = fetch_json(base_url, params={"$limit": limit, "$offset": offset})
        if not isinstance(batch, list):
            break
        records.extend(batch)
        if len(batch) < limit:
            break
        offset += limit

    logger.info("fetched socrata dataset", url=base_url, total=len(records))
    return records
