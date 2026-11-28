"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Field, FormFooter } from "../components/form";
import { Modal } from "../components/modal";
import { PageHeader } from "../components/page-header";
import { Alert } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader } from "../components/ui/card";
import { DataTable } from "../components/ui/data-table";
import { Input } from "../components/ui/input";
import { FULL_WEEK_HOURS, type WorkingHoursTarget } from "../lib/targets";

const columnHelper = createColumnHelper<WorkingHoursTarget>();

// Local date as YYYY-MM-DD (date input defaults; ToISOString is UTC, so
// shift by the timezone offset first).
function todayIsoDate(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function WorkingHoursPage() {
  const [targets, setTargets] = useState<WorkingHoursTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [percentage, setPercentage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<WorkingHoursTarget | null>(
    null,
  );
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    apiFetch<WorkingHoursTarget[]>("/working_hours/")
      .then((json) => {
        setTargets(json);
        setLoading(false);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Failed to fetch data",
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (effectiveDate === "" || percentage === "") return;
    try {
      await apiFetch<WorkingHoursTarget>("/working_hours/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effective_date: effectiveDate,
          percentage: Number(percentage),
        }),
      });
      setEffectiveDate("");
      setPercentage("");
      setShowAdd(false);
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add working hours",
      );
    }
  };

  const deleteTarget = async (target: WorkingHoursTarget) => {
    setError(null);
    try {
      await apiFetch(`/working_hours/${target.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete working hours",
      );
    }
  };

  const columns = [
    columnHelper.accessor("effective_date", {
      header: () => "Effective date",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("percentage", {
      header: () => "Percentage",
      cell: (info) => `${info.getValue()}%`,
    }),
    columnHelper.accessor("percentage", {
      id: "weekly_hours",
      header: () => "Hours per week",
      cell: (info) =>
        ((FULL_WEEK_HOURS * Number(info.getValue())) / 100).toFixed(2),
    }),
    columnHelper.display({
      id: "delete",
      header: () => "",
      cell: (info) => (
        <Button
          variant="danger-ghost"
          size="sm"
          onClick={() => setPendingDelete(info.row.original)}
          aria-label="Delete working hours"
        >
          ×
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: targets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      {error !== null && <Alert className="mb-6">{error}</Alert>}
      <PageHeader
        title="Working hours"
        description="Expected hours per day and week are derived from these targets."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setError(null);
              setEffectiveDate(todayIsoDate());
              setPercentage("");
              setShowAdd(true);
            }}
          >
            Add
          </Button>
        }
      />
      <Card>
        <CardHeader title="Working hours" />
        <DataTable
          table={table}
          loading={loading}
          error={loadError}
          emptyMessage="No data found."
        />
      </Card>
      {pendingDelete !== null && (
        <ConfirmDialog
          title="Delete working hours"
          message={`Delete working hours from ${pendingDelete.effective_date} (${pendingDelete.percentage}%)?`}
          onConfirm={() => {
            const target = pendingDelete;
            setPendingDelete(null);
            void deleteTarget(target);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {showAdd && (
        <Modal title="Add working hours" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field id="effective-date-input" label="Effective from">
              <Input
                id="effective-date-input"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </Field>
            <Field id="percentage-input" label="Percentage">
              <Input
                id="percentage-input"
                type="number"
                min="0"
                max="100"
                placeholder="(0–100)"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </Field>
            <FormFooter
              onCancel={() => setShowAdd(false)}
              submitLabel="Add"
              submitDisabled={effectiveDate === "" || percentage === ""}
            />
          </form>
        </Modal>
      )}
    </>
  );
}
