"use client";
import { CalendarWeekTable } from "./overview";
import { DayDetail } from "./day-detail";
import { Detail } from "./detail";
import { WeekDays } from "./daily";
import { useEffect, useState } from "react";

// ISO-8601 calendar week of a date — the same value the backend's
// PostgreSQL EXTRACT(WEEK FROM ...) produces.
function calendarWeekOf(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7; // ISO weeks start on Monday; Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // shift to the Thursday of this ISO week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function Home() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [calendarWeek, setCalendarWeek] = useState<number>(() =>
    calendarWeekOf(new Date()),
  );
  const [selectedDay, setSelectedDay] = useState<number>(0);

  // A selected day only makes sense for the displayed week — drop it when
  // the week or year changes.
  useEffect(() => {
    setSelectedDay(0);
  }, [year, calendarWeek]);

  return (
    <main className="flex flex-row gap-8 px-10 pt-3">
      <section className="flex-1">
        <CalendarWeekTable
          year={year}
          calendarWeek={calendarWeek}
          onYearChange={setYear}
          onCalendarWeekChange={setCalendarWeek}
        />
      </section>
      <section className="flex-1">
        {/* Invisible spacer mirroring the left panel's filter row height (same box model as the
            inputs), so the tables below line up with the calendar week table. */}
        <div aria-hidden className="invisible mb-3">
          <div className="w-28 rounded border border-zinc-300 px-3 py-1">
            &nbsp;
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <WeekDays
            year={year}
            calendarWeek={calendarWeek}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
          />
          {selectedDay > 0 && <DayDetail year={year} dayOfYear={selectedDay} />}
          <Detail year={year} calendarWeek={calendarWeek} />
        </div>
      </section>
    </main>
  );
}
