import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { formatDueDate, minutesToHours } from "../lib/dates";
import type { Assignment, Priority } from "../types";
import { useAssignments } from "../features/assignments/useAssignments";
import { useCourses } from "../features/courses/useCourses";

const priorities: Priority[] = ["low", "medium", "high"];

const emptyForm = {
  title: "",
  courseId: "",
  dueDate: new Date().toISOString().slice(0, 10),
  priority: "medium" as Priority,
  estimatedMinutes: 60,
  notes: "",
};

export function AssignmentsPage() {
  const { assignments, addAssignment, updateAssignment, setAssignmentStatus, deleteAssignment } =
    useAssignments();
  const { courses, addCourse } = useCourses();
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCourse, setNewCourse] = useState("");

  const visibleAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => filter === "all" || assignment.priority === filter,
      ),
    [assignments, filter],
  );

  function startEdit(assignment: Assignment) {
    setEditing(assignment);
    setForm({
      title: assignment.title,
      courseId: assignment.courseId ?? "",
      dueDate: assignment.dueAt.toDate().toISOString().slice(0, 10),
      priority: assignment.priority,
      estimatedMinutes: assignment.estimatedMinutes,
      notes: assignment.notes ?? "",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const course = courses.find((item) => item.id === form.courseId);
    const payload = {
      ...form,
      courseName: course?.name ?? "",
    };
    if (editing) {
      await updateAssignment(editing.id, payload);
    } else {
      await addAssignment(payload);
    }
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleAddCourse(event: FormEvent) {
    event.preventDefault();
    if (!newCourse.trim()) return;
    await addCourse({ name: newCourse.trim() });
    setNewCourse("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Assignment Core
            </p>
            <h1 className="text-3xl font-black text-slate-950">Assignments</h1>
          </div>
          <Select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="all">All priorities</option>
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4">
          {visibleAssignments.length ? (
            visibleAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold capitalize text-brand-700">
                        {assignment.priority}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {assignment.status.replace("_", " ")}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-950">{assignment.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignment.courseName || "No course"} · Due {formatDueDate(assignment.dueAt)} ·{" "}
                      {minutesToHours(assignment.remainingMinutes)} remaining
                    </p>
                    {assignment.notes ? (
                      <p className="mt-3 text-sm text-slate-600">{assignment.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setAssignmentStatus(assignment, "completed")}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Done
                    </Button>
                    <Button variant="ghost" onClick={() => startEdit(assignment)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => deleteAssignment(assignment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <h2 className="text-xl font-bold text-slate-950">No assignments yet</h2>
              <p className="mt-2 text-slate-500">
                Add two or three upcoming tasks so the planner can recommend what to do next.
              </p>
            </Card>
          )}
        </div>
      </section>

      <aside className="grid content-start gap-6">
        <Card>
          <CardTitle
            title={editing ? "Edit assignment" : "Add assignment"}
            eyebrow={editing ? "Update details" : "Planner input"}
          />
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </Field>
            <Field label="Course">
              <Select
                value={form.courseId}
                onChange={(event) => setForm({ ...form, courseId: event.target.value })}
              >
                <option value="">No course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Due date">
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  required
                />
              </Field>
              <Field label="Estimated minutes">
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={form.estimatedMinutes}
                  onChange={(event) =>
                    setForm({ ...form, estimatedMinutes: Number(event.target.value) })
                  }
                  required
                />
              </Field>
            </div>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              {editing ? "Save assignment" : "Add assignment"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle title="Courses" eyebrow="Optional" />
          <form className="flex gap-2" onSubmit={handleAddCourse}>
            <Input
              placeholder="e.g. Biology 201"
              value={newCourse}
              onChange={(event) => setNewCourse(event.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>
          <div className="mt-4 grid gap-2">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: course.color ?? "#6366f1" }}
                />
                {course.name}
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}
