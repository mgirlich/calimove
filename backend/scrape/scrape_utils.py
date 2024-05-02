from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

import bs4
import requests
from bs4 import BeautifulSoup


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False, env_file=".env.local")

    calimove_cookie: str
    course_id: int = 1467532


def crawl_page(path: str) -> requests.Response:
    headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept - language": "en-GB,en-US;q=0.9,en;q=0.8",
        "cache - control": "no-cache",
        "cookie": Settings().calimove_cookie,
        "dnt": "1",
        "upgrade - insecure - requests": "1",
        "user - agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    }

    resp = requests.get(
        f"https://www.calimove.com/courses/{path}",
        headers=headers
    )
    return resp


def get_page_soup(path: str, file_path: str) -> bs4.BeautifulSoup:
    file_path = Path("../rawdata/html").joinpath(file_path)
    if Path(file_path).is_file():
        with open(file_path) as f:
            page = f.read()
    else:
        page = crawl_page(path).text
        with open(file_path, "w+") as f:
            f.write(page)

    return BeautifulSoup(page, "html.parser")
