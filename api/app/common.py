from typing import Any
from corepy.api.result import ApiResult
from fastapi import Response
from fastapi.responses import JSONResponse


class BizException(Exception):
    def __init__(self, msg: str):
        self.msg = msg

    def to_result(self) -> ApiResult[Any]:
        return ApiResult.error(self.msg)

    def to_response(self) -> Response:
            return JSONResponse(
                content=self.to_result().model_dump(exclude_none=True),
                status_code=400,
            )
