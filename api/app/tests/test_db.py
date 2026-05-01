import logging

from sqlmodel import SQLModel

from app.config import engine

logger = logging.getLogger(__name__)

"""
uv run python -m pytest app/tests/test_db.py
"""
def test_db() -> None:
    print()
    logger.info("Initializing service")
    import app.entity # noqa: F401

    SQLModel.metadata.create_all(engine)
    logger.info("Service finished initializing")
