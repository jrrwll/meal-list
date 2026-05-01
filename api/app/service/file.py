import os
import logging
from fastapi import UploadFile
from corepy.datetime import format_date_compact
from corepy.codec import file_md5
from uuid import uuid4
from pathlib import Path
import shutil

from app.config import open_session, UPLOAD_TEMP_DIR, STATIC_FILE_DIR, FILE_URL_PREFX
from app.repo.file import create_file, get_file

logger = logging.getLogger(__name__)


def upload_file(file: UploadFile) -> str: 
    now_date_str = format_date_compact()
    file_dir = f"{UPLOAD_TEMP_DIR}/{now_date_str}"
    if not os.path.exists(file_dir):
        os.makedirs(file_dir, exist_ok=True)
    filename = file.filename
    if not filename:
        raise Exception("unsupported file")
    suffix = Path(filename).suffix
    size = file.size or 0

    file_temp_path = f"{file_dir}/{str(uuid4()).replace('-', '')}{suffix}"
    print(f"saving upload file {filename} to {file_temp_path}")
    with open(file_temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    id = file_md5(file_temp_path)

    with open_session() as session:
        pass
    file_entity = get_file(session, id)
    if file_entity:
        logger.warning(f"file {id} already exists, returning existing url")
        return file_entity.url

    static_file_dir = f"{STATIC_FILE_DIR}/{now_date_str}"
    if not os.path.exists(static_file_dir):
        os.makedirs(static_file_dir, exist_ok=True)

    static_file_name = f"{id}{suffix}"
    static_file_path = f"{static_file_dir}/{static_file_name}"
    logger.info(f"moving upload file {file_temp_path} to {static_file_path}")
    shutil.move(file_temp_path, static_file_path)

    url = f"{FILE_URL_PREFX}/{now_date_str}/{static_file_name}"
    file_entity = create_file(session, id, filename, size, url)
    return url
