from pydantic import BaseModel

class WeeklyHours(BaseModel):
    year: int
    calendar_week: int
    daily_hours: float
    days: float