"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Plus, Save, Upload, Download, Github, Users, Settings, BookOpen, Edit3, Trash2, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Separator } from "@/components/ui/Separator";
import { clsx, cryptoId, formatDateISO, getMonthMatrix, pickColorClass } from "@/lib/utils";

type ID = string;

type Subject = { id: ID; name: string; color: string };
type Student = { id: ID; name: string; email?: string };
type Lesson = { id: ID; date: string; subjectId: ID; title: string; objectives?: string; materials?: string; notes?: string; studentIds: ID[]; };

type DataModel = { subjects: Subject[]; students: Student[]; lessons: Lesson[]; lastSavedAt?: string };

const STORAGE_KEY = "lessonPlannerData-v2";

const defaultSubjects: Subject[] = [
  { id: cryptoId(), name: "Math", color: "bg-blue-500" },
  { id: cryptoId(), name: "Science", color: "bg-emerald-500" },
  { id: cryptoId(), name: "ELA", color: "bg-rose-500" },
  { id: cryptoId(), name: "History", color: "bg-amber-500" }
];
const defaultStudents: Student[] = [
  { id: cryptoId(), name: "Alex Carter" },
  { id: cryptoId(), name: "Bri Rivera" },
  { id: cryptoId(), name: "Dev Patel" }
];

export default function LessonPlannerApp() {
  const [data, setData] = useState<DataModel>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || ""); } catch { return null as any; }
  } || { subjects: defaultSubjects, students: defaultStudents, lessons: [] });
  const [view, setView] = useState<"calendar"|"list"|"students"|"settings">("calendar");
  const [calendarCursor, setCalendarCursor] = useState(()=>({year: new Date().getFullYear(), month: new Date().getMonth()}));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson|null>(null);
  const [activeDate, setActiveDate] = useState<string|null>(null);
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [branch, setBranch] = useState<string>("main");
  const [path, setPath] = useState<string>("data/lesson-planner.json");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSavedAt: new Date().toISOString() })); }, [data]);

  const subjectsById = useMemo(()=>Object.fromEntries(data.subjects.map(s=>[s.id,s])),[data.subjects]);
  const studentsById = useMemo(()=>Object.fromEntries(data.students.map(s=>[s.id,s])),[data.students]);
  const lessonsForDate = (iso:string)=> data.lessons.filter(l=>l.date===iso);

  const todayISO = formatDateISO(new Date());
  const rows = getMonthMatrix(calendarCursor.year, calendarCursor.month);
  const monthLabel = new Date(calendarCursor.year, calendarCursor.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function openNewLesson(dateISO: string){
    setActiveDate(dateISO);
    setEditingLesson({ id: cryptoId(), date: dateISO, subjectId: data.subjects[0]?.id || "", title: "", objectives: "", materials: "", notes: "", studentIds: [] });
    setEditorOpen(true);
  }
  function openEditLesson(lesson: Lesson){ setActiveDate(lesson.date); setEditingLesson({...lesson}); setEditorOpen(true); }
  function saveLesson(){
    if(!editingLesson) return;
    setData(prev=>{
      const exists = prev.lessons.some(l=>l.id===editingLesson.id);
      const lessons = exists ? prev.lessons.map(l=>l.id===editingLesson.id? editingLesson: l) : [...prev.lessons, editingLesson];
      return { ...prev, lessons };
    });
    setEditorOpen(false);
    setEditingLesson(null);
  }
  function deleteLesson(id: ID){ setData(prev=>({ ...prev, lessons: prev.lessons.filter(l=>l.id!==id) })); }
  function assignStudentsToDate(dateISO: string, ids: ID[]){
    setData(prev=>({ ...prev, lessons: prev.lessons.map(l=> l.date===dateISO ? { ...l, studentIds: Array.from(new Set([...l.studentIds, ...ids])) } : l ) }));
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lesson-planner-export-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(file: File){
    const reader = new FileReader();
    reader.onload = () => {
      try { setData(JSON.parse(String(reader.result))); } catch { alert("Invalid JSON"); }
    };
    reader.readAsText(file);
  }
  async function pushToGitHub(){
    if(!owner || !repo) return alert("Set owner & repo in Settings.");
    const res = await fetch("/api/github/push", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ owner, repo, branch, path, data }) });
    const j = await res.json();
    if(!res.ok) alert(j.error || "Push failed"); else alert("Synced to GitHub ✔️");
  }
  async function pullFromGitHub(){
    if(!owner || !repo) return alert("Set owner & repo in Settings.");
    const res = await fetch("/api/github/pull", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ owner, repo, branch, path }) });
    const j = await res.json();
    if(!res.ok) alert(j.error || "Pull failed");
    else {
      if (j?.data) setData(j.data);
      alert("Pulled from GitHub ✔️");
    }
  }

  return (
    <div className="min-h-screen w-full">
      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.div initial={{ rotate:-10, scale:0.9 }} animate={{ rotate:0, scale:1 }} transition={{ type:"spring", stiffness:260, damping:20 }} className="rounded-2xl bg-black p-2 text-white shadow">
              <CalendarIcon className="h-5 w-5" />
            </motion.div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Lesson Planner</h1>
              <p className="text-xs text-neutral-500">Notion‑style planning • color‑coded subjects • quick student add‑ons</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={()=>setView("calendar")} variant={view==="calendar"?"secondary":"ghost"}><CalendarIcon className="mr-2 h-4 w-4"/>Calendar</Button>
            <Button onClick={()=>setView("list")} variant={view==="list"?"secondary":"ghost"}><BookOpen className="mr-2 h-4 w-4"/>List</Button>
            <Button onClick={()=>setView("students")} variant={view==="students"?"secondary":"ghost"}><Users className="mr-2 h-4 w-4"/>Students</Button>
            <Separator className="mx-1 w-px h-6" />
            <Button onClick={()=>setView("settings")} variant={view==="settings"?"secondary":"ghost"}><Settings className="mr-2 h-4 w-4"/>Settings</Button>

            <div className="ml-2 hidden items-center gap-2 sm:flex">
              <Button variant="outline" onClick={exportJSON}><Download className="mr-2 h-4 w-4"/>Export</Button>
              <input type="file" accept="application/json" ref={fileInputRef} className="hidden" onChange={(e)=>e.target.files?.[0] && importJSON(e.target.files[0])} />
              <Button variant="outline" onClick={()=>fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Import</Button>
              <Button onClick={pushToGitHub}><Github className="mr-2 h-4 w-4"/>Sync</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.subjects.map((s)=>(
                  <div key={s.id} className="flex items-center justify-between rounded-xl border p-2">
                    <div className="flex items-center gap-2">
                      <span className={clsx("inline-block h-3 w-3 rounded-full", s.color)} />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" onClick={()=>renameSubject(s.id)}>Rename</Button>
                      <Button variant="ghost" onClick={()=>recolorSubject(s.id)}>Color</Button>
                      <Button variant="ghost" onClick={()=>removeSubject(s.id)} className="text-rose-600"><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </div>
                ))}
                <Button className="w-full" variant="secondary" onClick={addSubject}><Plus className="mr-2 h-4 w-4"/>Add subject</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Quick assign (same date)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-neutral-500">Add students to all lessons on a selected date.</p>
              <DateQuickAssign onAssign={(d, ids)=>assignStudentsToDate(d, ids)} students={data.students} />
            </CardContent>
          </Card>
        </aside>

        {/* Main views */}
        <section className="space-y-6">
          {view==="calendar" && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{monthLabel}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={()=>changeMonth(-1)}><ChevronLeft className="h-4 w-4"/></Button>
                  <Button variant="outline" onClick={()=>gotoToday()}>Today</Button>
                  <Button variant="ghost" onClick={()=>changeMonth(1)}><ChevronRight className="h-4 w-4"/></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-3 text-center text-xs text-neutral-500">
                  {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map(d=>(<div key={d} className="font-medium">{d}</div>))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-3">
                  {rows.map((row,ri)=>(
                    <React.Fragment key={ri}>
                      {row.map((cell,ci)=>(
                        <div key={`${ri}-${ci}`} className={clsx("min-h-[110px] rounded-2xl border bg-white p-2 hover:shadow-sm transition", cell && formatDateISO(cell)===todayISO && "ring-2 ring-black")}>
                          {cell ? (
                            <div className="flex h-full flex-col">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-semibold text-neutral-700">{cell.getDate()}</span>
                                <Button variant="ghost" onClick={()=>openNewLesson(formatDateISO(cell))}><Plus className="h-4 w-4"/></Button>
                              </div>
                              <div className="flex-1 space-y-2">
                                {lessonsForDate(formatDateISO(cell)).map((lesson)=>(
                                  <motion.div key={lesson.id} layout className="rounded-xl border p-2 text-left" whileHover={{ scale: 1.01 }} onClick={()=>openEditLesson(lesson)}>
                                    <div className="flex items-center gap-2">
                                      <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", subjectsById[lesson.subjectId]?.color)} />
                                      <p className="truncate text-xs font-medium">{lesson.title || "Untitled lesson"}</p>
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {lesson.studentIds.slice(0,4).map((sid)=>(<Badge key={sid}>{studentsById[sid]?.name || "?"}</Badge>))}
                                      {lesson.studentIds.length>4 && (<Badge>+{lesson.studentIds.length-4}</Badge>)}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : <div className="h-full" />}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {view==="list" && (
            <Card>
              <CardHeader><CardTitle>All lessons</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {data.lessons.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(l=>(
                    <div key={l.id} className="rounded-2xl border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={clsx("inline-block h-2.5 w-2.5 rounded-full", subjectsById[l.subjectId]?.color)} />
                          <h3 className="text-sm font-semibold">{l.title || "Untitled lesson"}</h3>
                        </div>
                        <div className="text-xs text-neutral-500">{l.date}</div>
                      </div>
                      <p className="mt-2 text-xs text-neutral-600 line-clamp-2">{l.objectives || l.notes || "No details yet."}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.studentIds.map(sid=>(<Badge key={sid}>{studentsById[sid]?.name || "?"}</Badge>))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button variant="outline" onClick={()=>openEditLesson(l)}><Edit3 className="mr-2 h-4 w-4"/>Edit</Button>
                        <Button variant="ghost" className="text-rose-600" onClick={()=>deleteLesson(l.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {view==="students" && (
            <Card>
              <CardHeader><CardTitle>Students</CardTitle></CardHeader>
              <CardContent><StudentManager students={data.students} onChange={(students)=>setData(p=>({ ...p, students }))} /></CardContent>
            </Card>
          )}

          {view==="settings" && (
            <Card>
              <CardHeader><CardTitle>Settings & Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border p-4">
                  <h3 className="text-sm font-semibold">Cloud sync (GitHub)</h3>
                  <p className="mb-3 text-xs text-neutral-500">Server-side sync via GitHub Contents API. Set GITHUB_TOKEN in .env.local on your deployment.</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div><label className="text-xs">Owner</label><Input className="mt-1" placeholder=":Lutricia:Brown." value={owner} onChange={e=>setOwner(e.target.value)} /></div>
                    <div><label className="text-xs">Repo</label><Input className="mt-1" placeholder="lesson-planner" value={repo} onChange={e=>setRepo(e.target.value)} /></div>
                    <div><label className="text-xs">Branch</label><Input className="mt-1" placeholder="main" value={branch} onChange={e=>setBranch(e.target.value)} /></div>
                    <div><label className="text-xs">Path</label><Input className="mt-1" placeholder="data/lesson-planner.json" value={path} onChange={e=>setPath(e.target.value)} /></div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={pushToGitHub}><Save className="mr-2 h-4 w-4"/>Push now</Button>
                    <Button variant="outline" onClick={pullFromGitHub}><Download className="mr-2 h-4 w-4"/>Pull</Button>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <h3 className="text-sm font-semibold">Data</h3>
                  <p className="mb-3 text-xs text-neutral-500">Local autosave is always on. Use Export/Import for backups.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogHeader><DialogTitle>{editingLesson && data.lessons.some(l=>l.id===editingLesson.id) ? "Edit lesson" : "New lesson"}</DialogTitle></DialogHeader>
        <DialogContent>
          {!!editingLesson && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs">Date</label>
                  <Input className="mt-1" type="date" value={editingLesson.date} onChange={(e)=>setEditingLesson({ ...editingLesson, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Subject</label>
                  <select className="input mt-1" value={editingLesson.subjectId} onChange={(e)=>setEditingLesson({ ...editingLesson, subjectId: e.target.value })}>
                    {data.subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs">Title</label>
                  <Input className="mt-1" placeholder="e.g., Lesson 12 – Fractions" value={editingLesson.title} onChange={(e)=>setEditingLesson({ ...editingLesson, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Objectives</label>
                  <Textarea className="mt-1" rows={3} placeholder="Learning goals..." value={editingLesson.objectives} onChange={(e)=>setEditingLesson({ ...editingLesson, objectives: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">Materials</label>
                  <Textarea className="mt-1" rows={3} placeholder="Links, books, supplies..." value={editingLesson.materials} onChange={(e)=>setEditingLesson({ ...editingLesson, materials: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs">Notes</label>
                  <Textarea className="mt-1" rows={3} placeholder="Activities, assessments, differentiation..." value={editingLesson.notes} onChange={(e)=>setEditingLesson({ ...editingLesson, notes: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs">Assign students</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.students.map(s=>{
                    const active = editingLesson.studentIds.includes(s.id);
                    return (
                      <button key={s.id} onClick={()=>toggleStudentOnLesson(s.id)} className={clsx("rounded-full border px-3 py-1 text-xs", active ? "bg-black text-white" : "bg-white hover:bg-neutral-50")}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogFooter>
          {!!editingLesson && data.lessons.some(l=>l.id===editingLesson.id) && (
            <Button variant="ghost" className="text-rose-600" onClick={()=> editingLesson && deleteLesson(editingLesson.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={()=>setEditorOpen(false)}>Cancel</Button>
          <Button onClick={saveLesson}><Save className="mr-2 h-4 w-4"/>Save</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );

  function gotoToday(){ const now = new Date(); setCalendarCursor({ year: now.getFullYear(), month: now.getMonth() }); }
  function changeMonth(delta:number){ setCalendarCursor(c=>{ const d = new Date(c.year, c.month + delta, 1); return { year: d.getFullYear(), month: d.getMonth() }; }); }
  function toggleStudentOnLesson(studentId: ID){
    if(!editingLesson) return;
    const has = editingLesson.studentIds.includes(studentId);
    setEditingLesson({ ...editingLesson, studentIds: has ? editingLesson.studentIds.filter(id=>id!==studentId) : [...editingLesson.studentIds, studentId] });
  }
  function addSubject(){
    const name = prompt("Subject name?")?.trim(); if(!name) return;
    const color = pickColorClass();
    setData(p=>({ ...p, subjects: [...p.subjects, { id: cryptoId(), name, color }] }));
  }
  function renameSubject(id: ID){
    const s = data.subjects.find(x=>x.id===id); if(!s) return;
    const name = prompt("New subject name", s.name)?.trim(); if(!name) return;
    setData(p=>({ ...p, subjects: p.subjects.map(x=> x.id===id ? { ...x, name } : x) }));
  }
  function recolorSubject(id: ID){
    const color = pickColorClass();
    setData(p=>({ ...p, subjects: p.subjects.map(x=> x.id===id ? { ...x, color } : x) }));
  }
  function removeSubject(id: ID){
    if (!confirm("Delete subject? This won't remove existing lessons.")) return;
    setData(p=>({ ...p, subjects: p.subjects.filter(x=> x.id!==id) }));
  }
}

function StudentManager({ students, onChange }:{ students: Student[]; onChange: (s: Student[]) => void }){
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const add = ()=>{ if(!name.trim()) return; onChange([...students, { id: cryptoId(), name: name.trim(), email: email.trim() || undefined }]); setName(""); setEmail(""); };
  const remove = (id: ID)=> onChange(students.filter(s=>s.id!==id));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Input placeholder="Student name" value={name} onChange={e=>setName(e.target.value)} />
        <Input placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        <Button onClick={add}><Plus className="mr-2 h-4 w-4"/>Add student</Button>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {students.map(s=>(
          <div key={s.id} className="flex items-center justify-between rounded-2xl border p-3">
            <div><div className="text-sm font-semibold">{s.name}</div>{s.email && <div className="text-xs text-neutral-500">{s.email}</div>}</div>
            <Button variant="ghost" className="text-rose-600" onClick={()=>remove(s.id)}><Trash2 className="mr-2 h-4 w-4"/>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DateQuickAssign({ onAssign, students }:{ onAssign:(dateISO:string, ids:ID[])=>void; students: Student[] }){
  const [date, setDate] = useState<string>(formatDateISO(new Date()));
  const [selected, setSelected] = useState<ID[]>([]);
  const toggle = (id: ID)=> setSelected(arr=> arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs">Date</label>
        <Input className="mt-1" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <div>
        <label className="text-xs">Students</label>
        <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-auto">
          {students.map(s=>(
            <button key={s.id} onClick={()=>toggle(s.id)} className={clsx("rounded-full border px-3 py-1 text-xs", selected.includes(s.id) ? "bg-black text-white" : "bg-white hover:bg-neutral-50")}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={()=>onAssign(date, selected)} disabled={!date || selected.length===0}><Users className="mr-2 h-4 w-4"/>Add to all lessons that day</Button>
    </div>
  );
}
