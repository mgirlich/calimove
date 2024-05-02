from scrape.scrape_utils import get_page_soup, Settings
import bs4
import re
from scrape.schemas import LectureBase, Section, SectionType, Exercise, Flow, Mod, Curriculum, NumberedExercise


def extract_section_title(section_tag: bs4.element.Tag) -> str:
    title_raw = section_tag.select_one(".section-title").text.strip()
    title = title_raw.split("\n")[0]

    return title


def extract_duration(title: str) -> tuple[str, int]:
    title = title.replace("\n", "")
    result = re.search(r"(.*)\((\d+):(\d+)\)", title)
    if result:
        title, minutes, seconds = result.groups()
        duration = 60 * int(minutes) + int(seconds)
    else:
        duration = 0

    return title, duration


def extract_section_lectures(section_tag: bs4.element.Tag) -> list[LectureBase]:
    lecture_tags = section_tag.select("li")

    lectures = []
    for lecture_tag in lecture_tags:
        lecture_id = lecture_tag.select_one("a").attrs.get("href").split("/").pop()
        title = lecture_tag.select_one(".lecture-name").text.strip()
        title, duration = extract_duration(title)

        lectures.append(LectureBase(lecture_id=lecture_id, title=title, duration=duration))

    return lectures


def parse_section(section_tag: bs4.element.Tag) -> Section | None:
    title = extract_section_title(section_tag)
    lectures = extract_section_lectures(section_tag)
    if 'Level' not in title:
        section_type = SectionType.other
    elif 'MODS' in title:
        section_type = SectionType.mod
    elif 'Explanation' in title:
        section_type = SectionType.flow
    else:
        section_type = SectionType.workout

    return Section(title=title, type=section_type, lectures=lectures)


def parse_exercise(lecture: LectureBase) -> Exercise:
    exercise = Exercise(name=lecture.title, lecture_id=lecture.lecture_id, duration=lecture.duration)

    return exercise


def parse_mod(lecture: LectureBase) -> Mod:
    # example for title: "Level 1 MODS - Week 14
    mod_title_regex = re.compile(r" - MOD$", flags=re.DOTALL)
    name = re.sub(mod_title_regex, '', lecture.title)
    mod = Mod(name=name, lecture_id=lecture.lecture_id)

    return mod


def scrape_curriculum() -> Curriculum:
    soup = get_page_soup(f"enrolled/{Settings().course_id}", file_path="curriculum.html")

    section_tags = soup.select_one(".course-mainbar").select(".row")
    sections = list(map(parse_section, section_tags))

    workouts = []
    mods = []
    flows = []

    for section in sections:
        match section.type:
            case SectionType.flow:
                level, flow_name = re.findall(r"Flow (\d[ABCD])", section.title)[0]
                exercises = []
                for i, lecture in enumerate(section.lectures):
                    exercise = NumberedExercise(position=i+1, **parse_exercise(lecture).model_dump())
                    exercises.append(exercise)
                flows.append(Flow(level=level, name=flow_name, numbered_exercises=exercises))
            case SectionType.mod:
                for lecture in section.lectures:
                    mods.append(parse_mod(lecture))
            case SectionType.workout:
                for lecture in section.lectures:
                    # remove junk lectures, e.g. the ""We'd like to get your feedback" lecture
                    is_junk_lecture = not lecture.title.startswith("L")
                    is_combo_lecture = '+' in lecture.title
                    if is_junk_lecture or is_combo_lecture:
                        continue
                    workouts.append(lecture)
            case SectionType.other:
                continue

    return Curriculum(workouts=workouts, mods=mods, flows=flows)
