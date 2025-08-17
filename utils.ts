export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function cryptoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function formatDateISO(d: Date): string {
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0,10);
}

export type ID = string;

export type Subject = {
  id: ID;
  name: string;
  color: string; // e.g. 'bg-rose-500'
};

export type Student = {
  id: ID;
  name: string;
  email?: string;
};

export type Lesson = {
  id: ID;
  date: string; // YYYY-MM-DD
  subjectId: ID;
  title: string;
  objectives?: string;
  materials?: string;
  notes?: string;
  studentIds: ID[];
};

export type DataModel = {
  subjects: Subject[];
  students: Student[];
  lessons: Lesson[];
  lastSavedAt?: string;
};

export const palette = [
  "bg-rose-500","bg-pink-500","bg-fuchsia-500","bg-purple-500","bg-violet-500",
  "bg-indigo-500","bg-blue-500","bg-sky-500","bg-cyan-500","bg-teal-500",
  "bg-emerald-500","bg-green-500","bg-lime-500","bg-yellow-500","bg-amber-500",
  "bg-orange-500","bg-red-500"
];

export function pickColorClass() {
  return palette[Math.floor(Math.random()*palette.length)];
}

export function getMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0-6
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i=0;i<startDay;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length < 42) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i=0;i<6;i++) rows.push(cells.slice(i*7, i*7+7));
  return rows;
}
