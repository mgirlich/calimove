from scrape.scrape_utils import get_page_soup
from scrape.scrape_curriculum import LectureBase
import scrape.schemas as schemas
from pathlib import Path
import re
import requests


def store_image(image_url: str, file_name) -> Path:
    file_path = Path("../rawdata/images/original").joinpath(file_name)

    if not Path(file_path).is_file():
        resp = requests.get(image_url)
        image = resp.content
        with open(file_path, "wb") as f:
            f.write(image)

    return file_path


def image_filename(lecture: LectureBase, name):
    return f"lecture-{lecture.lecture_id}-{name}"


def scrape_workout(lecture: LectureBase) -> schemas.Workout:
    file_path = f"lecture_{lecture.lecture_id}.html"
    soup = get_page_soup(f"mobility2/lectures/{lecture.lecture_id}/", file_path)

    content_tag = soup.select_one(".lecture-content")
    level, day, flow_name = re.findall(r"L(\d) - W\d+ - Day (\d+) - .* - F ?\d(.*)", lecture.title)[0]

    image_urls = [tag.attrs.get("src") for tag in content_tag.select(".row img")]

    store_image(image_urls[0], file_name=image_filename(lecture, "n_sets.png"))
    for i, image_url in enumerate(image_urls[1:]):
        store_image(image_url, file_name=image_filename(lecture, f"exercise-{i + 1}.gif"))

    workout = schemas.Workout(lecture_id=lecture.lecture_id,
                              flow_id=schemas.FlowId(level=level, name=flow_name),
                              day=day,
                              duration=lecture.duration)

    return workout
