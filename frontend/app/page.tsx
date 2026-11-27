"use client";
import { CalendarWeekTable } from "./overview";
import { DayDetail } from "./day-detail";
import { Detail } from "./detail";
import { WeekDays } from "./daily";
import { Modal } from "./components/modal";
import { apiFetch } from "./lib/api";
import { fetchProjects, type Project } from "./lib/projects";
import { useCallback, useEffect, useState, type FormEvent } from "react";

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

// Local date/time as "YYYY-MM-DDTHH:MM" for datetime-local inputs.
function localDateTimeIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function Home() {
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [calendarWeek, setCalendarWeek] = useState<number>(() =>
    calendarWeekOf(new Date()),
  );
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddTime, setShowAddTime] = useState<boolean>(false);
  const [timeProjectId, setTimeProjectId] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [timeDescription, setTimeDescription] = useState<string>("");

  // On first load, select the top row of the calendar week table (the most
  // recent week with data) instead of the current week.
  const handleDefaultSelect = useCallback((y: number, w: number) => {
    setYear(y);
    setCalendarWeek(w);
  }, []);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);

  // A selected day only makes sense for the displayed week — drop it when
  // the week or year changes.
  useEffect(() => {
    setSelectedDay(0);
  }, [year, calendarWeek]);

  const openAddTime = () => {
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    const end = new Date();
    setTimeProjectId("");
    setTimeStart(localDateTimeIso(start));
    setTimeEnd(localDateTimeIso(end));
    setTimeDescription("");
    setError(null);
    setShowAddTime(true);
  };

  const canSubmitTime =
    timeProjectId !== "" &&
    timeStart !== "" &&
    timeEnd !== "" &&
    timeEnd > timeStart;

  const handleSubmitTime = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitTime) return;
    try {
      await apiFetch("/time/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: Number(timeProjectId),
          start: timeStart,
          end: timeEnd,
          description: timeDescription === "" ? null : timeDescription,
        }),
      });
      setShowAddTime(false);
      setError(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add time");
    }
  };

  return (
    <main className="flex flex-col px-10 pt-3">
      {error !== null && (
        <div className="mb-3 p-4 text-center rounded-lg border border-red-200 bg-red-50 text-red-700 text-lg font-medium">
          {error}
        </div>
      )}
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={openAddTime}
          className="rounded bg-blue-50 border border-blue-200 px-3 py-1 font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Add time
        </button>
      </div>
      <div className="flex flex-row gap-8">
        <section className="flex-1">
          <CalendarWeekTable
            year={year}
            calendarWeek={calendarWeek}
            onYearChange={setYear}
            onCalendarWeekChange={setCalendarWeek}
            onDefaultSelect={handleDefaultSelect}
            refreshKey={refreshKey}
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
              refreshKey={refreshKey}
            />
            {selectedDay > 0 && (
              <DayDetail
                year={year}
                dayOfYear={selectedDay}
                refreshKey={refreshKey}
              />
            )}
            <Detail
              year={year}
              calendarWeek={calendarWeek}
              refreshKey={refreshKey}
            />
          </div>
        </section>
      </div>
      {showAddTime && (
        <Modal title="Add time" onClose={() => setShowAddTime(false)}>
          <form onSubmit={handleSubmitTime} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="time-project-input"
                className="font-medium text-zinc-700"
              >
                Project:
              </label>
              <select
                id="time-project-input"
                value={timeProjectId}
                onChange={(e) => setTimeProjectId(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">(select)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.project_nr !== null
                      ? ` (${project.project_nr})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="time-start-input"
                className="font-medium text-zinc-700"
              >
                Start:
              </label>
              <input
                id="time-start-input"
                type="datetime-local"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="time-end-input"
                className="font-medium text-zinc-700"
              >
                End:
              </label>
              <input
                id="time-end-input"
                type="datetime-local"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex items-center gap-4">
              <label
                htmlFor="time-description-input"
                className="font-medium text-zinc-700"
              >
                Description:
              </label>
              <input
                id="time-description-input"
                type="text"
                placeholder="(optional)"
                value={timeDescription}
                onChange={(e) => setTimeDescription(e.target.value)}
                className="border border-zinc-300 rounded px-3 py-1 bg-white text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48"
              />
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddTime(false)}
                className="rounded border border-zinc-300 bg-white px-3 py-1 font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmitTime}
                className="rounded bg-blue-500 px-3 py-1 font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
