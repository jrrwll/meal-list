from app.config import SessionDep
from app.model import MealListParam, MealSimplePublic, TagSimplePublic
from app.repo.meal import list_meals


def list_tags(session: SessionDep, name: str | None) -> list[TagSimplePublic]:
    tags = {}

    meals = list_meals(session, MealListParam())
    for meal in meals:
        meal_model = MealSimplePublic.create(meal)
        for tag in meal_model.tags:
            if name:
                if name not in tag:
                    continue

            tag_model = tags.get(tag)
            if tag_model:
                tag_model.count += 1
            else:
                tags[tag] = TagSimplePublic(name=tag, count=1)

    return sorted(tags.values(), key=lambda x: x.count, reverse=True)
