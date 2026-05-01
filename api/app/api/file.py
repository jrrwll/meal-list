from typing import Any

from corepy.api.result import ApiResult
from fastapi import File, UploadFile
from fastapi.routing import APIRouter

from app.service.file import upload_file

router = APIRouter(prefix="/file", tags=["file"])


@router.post("/upload", response_model=ApiResult[str])
def _upload(file: UploadFile = File(...)) -> Any:
    res = upload_file(file)
    return ApiResult.ok(res)
