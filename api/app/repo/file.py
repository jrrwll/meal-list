from datetime import datetime

from sqlmodel import select

from app.config import SessionDep
from app.entity import File


def get_file(session: SessionDep, id: str) -> File | None:
    statement = select(File).where(File.id == id)
    return session.exec(statement).first()


def create_file(session: SessionDep, id: str, filename: str, size: int, url: str) -> File:
    entity = File(id=id, filename=filename, size=size, url=url, ctime=datetime.now())
    session.add(entity)
    session.commit()
    return entity
