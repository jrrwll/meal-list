from fastapi import FastAPI, Request, Response
from fastapi.routing import APIRouter
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api import meal_router, file_router
from app.common import BizException
from app.config import API_PREFIX_STR, STATIC_FILE_DIR

app = FastAPI(
    title="Meal List",
    openapi_url=f"{API_PREFIX_STR}/openapi.json"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()
api_router.include_router(meal_router)
api_router.include_router(file_router)

app.include_router(api_router, prefix=API_PREFIX_STR)
app.mount("/img", StaticFiles(directory=STATIC_FILE_DIR))

@app.exception_handler(BizException)
async def _http_exception_handler(_: Request, e: BizException) -> Response:
    return e.to_response()
