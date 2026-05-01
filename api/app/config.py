from collections.abc import Generator
from typing import Annotated
import os

from dotenv import load_dotenv
from fastapi import Depends
from sqlmodel import Session
from sqlmodel import create_engine

load_dotenv()

API_PREFIX_STR = "/api/v1"
UPLOAD_TEMP_DIR = "workspace/upload"
STATIC_FILE_DIR = "images"

FILE_URL_PREFX = str(os.environ.get("FILE_URL_PREFX"))
SQLALCHEMY_DATABASE_URI = str(os.environ.get("SQLALCHEMY_DATABASE_URI", "sqlite:///meal-list.db"))

engine = create_engine(SQLALCHEMY_DATABASE_URI, echo=True)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]


def open_session() -> Session:
    return Session(engine)
