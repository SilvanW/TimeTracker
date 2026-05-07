"use client";
import { CalendarWeekTable } from "./overview";
import { Detail } from "./detail";
import { useEffect, useState } from "react";

export default function Home() {
  const [year, setYear] = useState<number>(2026);
  const [calendarWeek, setCalendarWeek] = useState<number>(8);

  useEffect(() => {
    console.log(year);
  }, [year]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <div className="flex flex-col h-full min-h-screen">
        <header className="w-full px-8 py-6 flex items-center bg-gray-300">
          <h1 className="text-2xl font-bold text-zinc-800 tracking-tight">
            TimeTracker
          </h1>
        </header>
        <main className="flex flex-row gap-8 px-8">
          <section className="w-full max-w-2xl">
            <CalendarWeekTable
              year={year}
              calendar_week={calendarWeek}
              onYearChange={setYear}
              onCalendarWeekChange={setCalendarWeek}
            />
          </section>
          <section className="w-full max-w-2xl">
            <Detail year={year} onChange={setYear} />
          </section>
        </main>
      </div>
    </div>
  );
}
