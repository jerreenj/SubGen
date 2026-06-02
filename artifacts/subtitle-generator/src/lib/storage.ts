export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  position: "top" | "middle" | "bottom";
  textAlign: "left" | "center" | "right";
  textShadow: boolean;
  italic: boolean;
  uppercase: boolean;
}

export interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  style: CaptionStyle;
  segments: Segment[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "subgen:projects";

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: "Inter",
  fontSize: 48,
  fontWeight: "bold",
  color: "#ffffff",
  backgroundColor: "rgba(0,0,0,0.5)",
  position: "bottom",
  textAlign: "center",
  textShadow: true,
  italic: false,
  uppercase: true,
};

function load(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

function persist(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects(): Project[] {
  return load().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getProject(id: string): Project | undefined {
  return load().find((p) => p.id === id);
}

export function createProject(name: string, description?: string): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    description: description || undefined,
    style: { ...DEFAULT_STYLE },
    segments: [],
    createdAt: now,
    updatedAt: now,
  };
  const projects = load();
  projects.push(project);
  persist(projects);
  return project;
}

export function saveProject(project: Project): void {
  const projects = load();
  const idx = projects.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx === -1) projects.push(updated);
  else projects[idx] = updated;
  persist(projects);
}

export function deleteProject(id: string): void {
  persist(load().filter((p) => p.id !== id));
}

// ── Export helpers ────────────────────────────────────────────────────────────

function toSRTTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function toVTTTime(sec: number): string {
  return toSRTTime(sec).replace(",", ".");
}

function toASSTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec % 1) * 100);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export function exportSRT(project: Project): string {
  const sorted = [...project.segments].sort((a, b) => a.startTime - b.startTime);
  return (
    sorted
      .map(
        (s, i) =>
          `${i + 1}\n${toSRTTime(s.startTime)} --> ${toSRTTime(s.endTime)}\n${s.text}`,
      )
      .join("\n\n") + "\n"
  );
}

export function exportVTT(project: Project): string {
  const sorted = [...project.segments].sort((a, b) => a.startTime - b.startTime);
  const body = sorted
    .map((s) => `${toVTTTime(s.startTime)} --> ${toVTTTime(s.endTime)}\n${s.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export function exportASS(project: Project): string {
  const sorted = [...project.segments].sort((a, b) => a.startTime - b.startTime);
  const bold = project.style.fontWeight === "bold" ? "1" : "0";
  const italic = project.style.italic ? "1" : "0";
  const header = `[Script Info]
Title: ${project.name}
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${project.style.fontFamily},${project.style.fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,${bold},${italic},0,0,100,100,0,0,1,2,1,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const events = sorted
    .map((s) => {
      const text = project.style.uppercase ? s.text.toUpperCase() : s.text;
      return `Dialogue: 0,${toASSTime(s.startTime)},${toASSTime(s.endTime)},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  return `${header}\n${events}\n`;
}
