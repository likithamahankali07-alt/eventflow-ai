import logging
from supabase import create_client, Client
from config import settings

logger = logging.getLogger("eventflow.db")

supabase: Client = None

try:
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and "placeholder" not in settings.SUPABASE_URL:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Connected to Supabase PostgreSQL service role client.")
    else:
        logger.warning("Supabase credentials placeholder detected. Running in setup/standalone mode.")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {e}")
    supabase = None

def get_db() -> Client:
    """Returns the active Supabase client instance or raises HTTP error if unconfigured."""
    if not supabase:
        raise RuntimeError("Database connection not configured. Please specify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    return supabase
