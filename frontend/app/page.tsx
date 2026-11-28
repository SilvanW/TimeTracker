"use client";
import { CalendarWeekTable } from "./overview";
import { DayDetail } from "./day-detail";
import { Detail } from "./detail";
import { WeekDays } from "./daily";
import { Modal } from "./components/modal";
import { PageHeader } from "./components/page-header";
import { Field, FormFooter } from "./components/form";
import { Alert } from "./components/ui/alert";
import { Button } from "./components/ui/button";
import { Input, Select } from "./components/ui/input";
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

// Local date as "YYYY-MM-DD" for date inputs.
function localDateIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Local date/time as "YYYY-MM-DDTHH:MM" for datetime-local inputs.
function localDateTimeIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${localDateIso(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type TimeEntry = { start: string; end: string };

// Extract "H:MM-HH:MM" ranges (e.g. "4:45-7:40 10:30-12:15") as "HH:MM" pairs.
function parseTimeRanges(input: string): TimeEntry[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ranges: TimeEntry[] = [];
  const pattern = /(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    const startHour = Number(match[1]);
    const startMinute = Number(match[2]);
    const endHour = Number(match[3]);
    const endMinute = Number(match[4]);
    if (startHour > 23 || startMinute > 59 || endHour > 23 || endMinute > 59) {
      continue;
    }
    ranges.push({
      start: `${pad(startHour)}:${pad(startMinute)}`,
      end: `${pad(endHour)}:${pad(endMinute)}`,
    });
  }
  return ranges;
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
  const [timeMode, setTimeMode] = useState<"manual" | "paste">("manual");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [timeDay, setTimeDay] = useState<string>("");
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timePaste, setTimePaste] = useState<string>("");
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
    setTimeProjectId("");
    setTimeMode("manual");
    setTimeStart(localDateTimeIso(start));
    setTimeEnd(localDateTimeIso(new Date()));
    setTimeDay(localDateIso(new Date()));
    setTimeEntries([]);
    setTimePaste("");
    setTimeDescription("");
    setError(null);
    setShowAddTime(true);
  };

  const addParsedTimes = () => {
    const ranges = parseTimeRanges(timePaste);
    if (ranges.length === 0) {
      setError("No times found. Use a format like 4:45-7:40 10:30-12:15.");
      return;
    }
    setTimeEntries((entries) => [...entries, ...ranges]);
    setTimePaste("");
    setError(null);
  };

  const updateEntryTime = (
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setTimeEntries((entries) =>
      entries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const removeEntry = (index: number) => {
    setTimeEntries((entries) => entries.filter((_, i) => i !== index));
  };

  const canSubmitTime =
    timeProjectId !== "" &&
    (timeMode === "manual"
      ? timeStart !== "" && timeEnd !== "" && timeEnd > timeStart
      : timeDay !== "" &&
        timeEntries.length > 0 &&
        timeEntries.every((entry) => entry.end > entry.start));

  // Hours between the two "YYYY-MM-DDTHH:MM" values (manual mode).
  const manualTimeWorked =
    timeStart !== "" && timeEnd !== "" && timeEnd > timeStart
      ? (new Date(timeEnd).getTime() - new Date(timeStart).getTime()) / 3600000
      : null;

  // Hours of a "HH:MM" value (for the per-entry time worked in paste mode).
  const hoursOfTime = (time: string) =>
    Number(time.slice(0, 2)) + Number(time.slice(3, 5)) / 60;

  const handleSubmitTime = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitTime) return;
    try {
      const description = timeDescription === "" ? null : timeDescription;
      if (timeMode === "manual") {
        await apiFetch("/time/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: Number(timeProjectId),
            start: timeStart,
            end: timeEnd,
            description,
          }),
        });
      } else {
        for (const entry of timeEntries) {
          await apiFetch("/time/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: Number(timeProjectId),
              start: `${timeDay}T${entry.start}:00`,
              end: `${timeDay}T${entry.end}:00`,
              description,
            }),
          });
        }
      }
      setShowAddTime(false);
      setError(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add time");
    }
  };

  return (
    <>
      {error !== null && <Alert className="mb-6">{error}</Alert>}
      <PageHeader
        title="Overview"
        description={`${year} · Week ${calendarWeek}`}
        actions={
          <Button variant="primary" onClick={openAddTime}>
            Add time
          </Button>
        }
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <CalendarWeekTable
          year={year}
          calendarWeek={calendarWeek}
          onYearChange={setYear}
          onCalendarWeekChange={setCalendarWeek}
          onDefaultSelect={handleDefaultSelect}
          refreshKey={refreshKey}
        />
        <div className="flex flex-col gap-6">
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
              onEdited={() => setRefreshKey((k) => k + 1)}
            />
          )}
          <Detail
            year={year}
            calendarWeek={calendarWeek}
            refreshKey={refreshKey}
          />
        </div>
      </div>
      {showAddTime && (
        <Modal title="Add time" onClose={() => setShowAddTime(false)} wide>
          <form onSubmit={handleSubmitTime} className="flex flex-col gap-4">
            <Field id="time-project-input" label="Project">
              <Select
                id="time-project-input"
                value={timeProjectId}
                onChange={(e) => setTimeProjectId(e.target.value)}
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
              </Select>
            </Field>
            <div className="inline-flex self-start rounded-lg border border-line bg-surface-2 p-0.5">
              <button
                type="button"
                onClick={() => setTimeMode("manual")}
                className={
                  timeMode === "manual"
                    ? "rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-sm"
                    : "rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink"
                }
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setTimeMode("paste")}
                className={
                  timeMode === "paste"
                    ? "rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-sm"
                    : "rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink"
                }
              >
                Paste ranges
              </button>
            </div>
            {timeMode === "manual" && (
              <>
                <Field id="time-start-input" label="Start">
                  <Input
                    id="time-start-input"
                    type="datetime-local"
                    value={timeStart}
                    onChange={(e) => setTimeStart(e.target.value)}
                  />
                </Field>
                <Field
                  id="time-end-input"
                  label="End"
                  hint={
                    manualTimeWorked !== null
                      ? `Time worked: ${manualTimeWorked.toFixed(2)} h`
                      : undefined
                  }
                >
                  <Input
                    id="time-end-input"
                    type="datetime-local"
                    value={timeEnd}
                    onChange={(e) => setTimeEnd(e.target.value)}
                  />
                </Field>
              </>
            )}
            {timeMode === "paste" && (
              <>
                <Field id="time-day-input" label="Day">
                  <Input
                    id="time-day-input"
                    type="date"
                    value={timeDay}
                    onChange={(e) => setTimeDay(e.target.value)}
                  />
                </Field>
                <Field id="time-paste-input" label="Times">
                  <div className="flex gap-2">
                    <Input
                      id="time-paste-input"
                      type="text"
                      placeholder="4:45-7:40 10:30-12:15"
                      value={timePaste}
                      onChange={(e) => setTimePaste(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addParsedTimes();
                        }
                      }}
                      className="min-w-0 flex-1"
                    />
                    <Button
                      variant="accent-soft"
                      onClick={addParsedTimes}
                      className="shrink-0"
                    >
                      Add
                    </Button>
                  </div>
                </Field>
                {timeEntries.length === 0 ? (
                  <p className="text-sm text-ink-3">
                    Paste time ranges above, then add and edit them below.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {timeEntries.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          size="sm"
                          type="time"
                          value={entry.start}
                          onChange={(e) =>
                            updateEntryTime(index, "start", e.target.value)
                          }
                          className="w-28"
                        />
                        <span className="text-ink-3">–</span>
                        <Input
                          size="sm"
                          type="time"
                          value={entry.end}
                          onChange={(e) =>
                            updateEntryTime(index, "end", e.target.value)
                          }
                          className="w-28"
                        />
                        <div className="flex-1" />
                        <span className="w-14 text-right text-sm text-ink-2">
                          {entry.end > entry.start
                            ? `${(
                                hoursOfTime(entry.end) -
                                hoursOfTime(entry.start)
                              ).toFixed(2)} h`
                            : ""}
                        </span>
                        <Button
                          variant="danger-ghost"
                          size="sm"
                          onClick={() => removeEntry(index)}
                          aria-label="Remove time range"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Field id="time-description-input" label="Description">
              <Input
                id="time-description-input"
                type="text"
                placeholder="(optional)"
                value={timeDescription}
                onChange={(e) => setTimeDescription(e.target.value)}
              />
            </Field>
            <FormFooter
              onCancel={() => setShowAddTime(false)}
              submitLabel="Add time"
              submitDisabled={!canSubmitTime}
            />
          </form>
        </Modal>
      )}
    </>
  );
}
