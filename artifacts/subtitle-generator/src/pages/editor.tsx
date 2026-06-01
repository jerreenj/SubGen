import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { getAiSettings, hasApiKey } from "@/lib/ai-settings";
import { ArrowLeft, Play, Pause, Upload, Download, Wand2, Settings2, Plus, Trash2, Save, FileVideo } from "lucide-react";
import { 
  useGetProject, getGetProjectQueryKey,
  useUpdateProject,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  useReplaceSegments,
  customFetch,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Segment, CaptionStyle, ProjectWithSegments } from "@workspace/api-client-react";

const FONTS = [
  "Inter", "Roboto", "Montserrat", "Bebas Neue", "Anton", 
  "Playfair Display", "Space Mono", "DM Sans", "Oswald", "Abril Fatface"
];

function formatTime(seconds: number) {
  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

export default function Editor() {
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useGetProject(projectId, { 
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) } 
  });

  const updateProject = useUpdateProject();
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();
  const replaceSegments = useReplaceSegments();

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Handlers
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const [, navigate] = useLocation();

  const handleTranscribe = async () => {
    if (!mediaFile) return;

    if (!hasApiKey()) {
      toast({ title: "No API key", description: "Add your key in Settings first.", variant: "destructive" });
      navigate("/settings");
      return;
    }

    setIsTranscribing(true);
    
    try {
      const { apiKey, baseUrl, model } = getAiSettings();
      const formData = new FormData();
      formData.append("file", mediaFile);

      const headers: Record<string, string> = { "x-api-key": apiKey };
      if (baseUrl.trim()) headers["x-base-url"] = baseUrl.trim();
      if (model.trim()) headers["x-model"] = model.trim();

      const response = await fetch(`/api/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error || "Transcription failed");
      }
      const result = await response.json();

      replaceSegments.mutate({
        id: projectId,
        data: {
          segments: result.segments.map((s: any) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            text: s.text,
            order: s.order || 0
          }))
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Transcription complete" });
        }
      });
    } catch (err) {
      toast({ title: "Transcription failed", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const response = await customFetch<{content: string, filename: string}>(`/api/projects/${projectId}/export?format=${format}`, { method: 'GET' });
      const blob = new Blob([response.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename || `export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const updateStyle = (key: keyof CaptionStyle, value: any) => {
    if (!project) return;
    updateProject.mutate({
      id: projectId,
      data: {
        style: { ...project.style, [key]: value }
      }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })
    });
  };

  const activeSegment = project?.segments.find(
    s => s.startTime <= currentTime && s.endTime >= currentTime
  );

  if (isLoading) return <div className="p-8 text-center"><Skeleton className="h-[500px] w-full" /></div>;
  if (!project) return <div className="p-8 text-center text-red-500">Project not found</div>;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 shrink-0 bg-card/30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <h1 className="font-semibold text-sm">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {mediaUrl && (
            <Button variant="secondary" size="sm" onClick={handleTranscribe} disabled={isTranscribing} className="gap-2">
              <Wand2 className="h-4 w-4" />
              {isTranscribing ? "Transcribing..." : "Transcribe with AI"}
            </Button>
          )}
          <Select onValueChange={handleExport}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Export as..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="srt">Export .SRT</SelectItem>
              <SelectItem value="vtt">Export .VTT</SelectItem>
              <SelectItem value="ass">Export .ASS</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="default" size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save Project
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Player */}
        <div className="flex-[1.5] border-r border-border/50 flex flex-col bg-black/20">
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            {!mediaUrl ? (
              <div className="w-full max-w-md aspect-video border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-card/30 hover:border-primary/50 transition-all">
                <FileVideo className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">Upload Media to Start</p>
                <p className="text-sm mt-1 mb-4 opacity-70">MP4, WEBM, MP3, WAV</p>
                <Label htmlFor="media-upload" className="cursor-pointer">
                  <div className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md inline-flex items-center justify-center font-medium text-sm transition-colors">
                    Browse Files
                  </div>
                  <input id="media-upload" type="file" accept="video/*,audio/*" className="hidden" onChange={handleMediaUpload} />
                </Label>
              </div>
            ) : (
              <div className="w-full max-w-4xl relative aspect-video bg-black rounded-lg overflow-hidden group">
                <video 
                  ref={videoRef}
                  src={mediaUrl} 
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onClick={togglePlayback}
                />
                
                {/* Caption Overlay */}
                {activeSegment && (
                  <div 
                    className="absolute left-0 right-0 pointer-events-none flex"
                    style={{
                      top: project.style.position === 'top' ? '10%' : project.style.position === 'middle' ? '50%' : 'auto',
                      bottom: project.style.position === 'bottom' ? '10%' : 'auto',
                      transform: project.style.position === 'middle' ? 'translateY(-50%)' : 'none',
                      justifyContent: project.style.textAlign === 'left' ? 'flex-start' : project.style.textAlign === 'right' ? 'flex-end' : 'center',
                      padding: '0 5%'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: project.style.fontFamily,
                        fontSize: `${project.style.fontSize}px`,
                        fontWeight: project.style.fontWeight,
                        color: project.style.color,
                        backgroundColor: project.style.backgroundColor,
                        textTransform: project.style.uppercase ? 'uppercase' : 'none',
                        fontStyle: project.style.italic ? 'italic' : 'normal',
                        textShadow: project.style.textShadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                        padding: '0.2em 0.4em',
                        borderRadius: '0.1em',
                        textAlign: project.style.textAlign,
                        lineHeight: 1.2
                      }}
                    >
                      {activeSegment.text}
                    </div>
                  </div>
                )}
                
                {/* Player Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={togglePlayback}>
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1">
                      <Slider 
                        value={[currentTime]} 
                        max={videoRef.current?.duration || 100} 
                        step={0.1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="text-xs text-white/80 font-mono">
                      {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Track */}
        <div className="flex-1 flex flex-col border-r border-border/50 bg-card/10">
          <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/30 shrink-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              Timeline
            </h2>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
              createSegment.mutate({
                id: projectId,
                data: {
                  startTime: currentTime,
                  endTime: currentTime + 2,
                  text: "New subtitle",
                  order: project.segments.length
                }
              }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }) });
            }}>
              <Plus className="h-3 w-3 mr-1" /> Add Segment
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {project.segments.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No segments yet. Transcribe audio or add manually.
              </div>
            ) : (
              project.segments.sort((a,b) => a.startTime - b.startTime).map((segment, i) => (
                <div 
                  key={segment.id} 
                  className={`p-3 rounded-lg border ${activeSegment?.id === segment.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'} transition-colors group relative`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">#{i+1}</span>
                    <Input 
                      className="h-6 w-24 text-xs font-mono px-2 py-0" 
                      defaultValue={segment.startTime.toFixed(3)}
                      onBlur={(e) => updateSegment.mutate({ id: segment.id, data: { startTime: parseFloat(e.target.value) } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }) })}
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <Input 
                      className="h-6 w-24 text-xs font-mono px-2 py-0" 
                      defaultValue={segment.endTime.toFixed(3)}
                      onBlur={(e) => updateSegment.mutate({ id: segment.id, data: { endTime: parseFloat(e.target.value) } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }) })}
                    />
                    <div className="flex-1"></div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                      deleteSegment.mutate({ id: segment.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }) });
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input 
                    className="border-transparent bg-transparent hover:border-border/50 focus:bg-background focus:border-primary px-2"
                    defaultValue={segment.text}
                    onBlur={(e) => {
                      if (e.target.value !== segment.text) {
                        updateSegment.mutate({ id: segment.id, data: { text: e.target.value } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }) });
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Style Editor */}
        <div className="w-80 flex flex-col bg-card/30 shrink-0">
          <div className="h-12 border-b border-border/50 flex items-center px-4 bg-card/30 shrink-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Style Inspector
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Typography</Label>
              <div className="space-y-2">
                <Select value={project.style.fontFamily} onValueChange={(v) => updateStyle('fontFamily', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map(f => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Weight</Label>
                    <Select value={project.style.fontWeight} onValueChange={(v) => updateStyle('fontWeight', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Regular</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="900">Black</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1.5">
                    <Label className="text-xs">Size</Label>
                    <Input 
                      type="number" 
                      value={project.style.fontSize} 
                      onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Appearance</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: project.style.color }}>
                      <input type="color" className="opacity-0 w-full h-full cursor-pointer" value={project.style.color} onChange={e => updateStyle('color', e.target.value)} />
                    </div>
                    <Input className="flex-1 h-8 text-xs font-mono" value={project.style.color} onChange={e => updateStyle('color', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Background</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-border" style={{ backgroundColor: project.style.backgroundColor }}></div>
                    <Input className="flex-1 h-8 text-xs font-mono" value={project.style.backgroundColor} onChange={e => updateStyle('backgroundColor', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm font-normal">Drop Shadow</Label>
                <Switch checked={project.style.textShadow} onCheckedChange={(c) => updateStyle('textShadow', c)} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm font-normal">Uppercase</Label>
                <Switch checked={project.style.uppercase} onCheckedChange={(c) => updateStyle('uppercase', c)} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm font-normal">Italic</Label>
                <Switch checked={project.style.italic} onCheckedChange={(c) => updateStyle('italic', c)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position & Alignment</Label>
              <Select value={project.style.position} onValueChange={(v) => updateStyle('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="middle">Middle</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={project.style.textAlign} onValueChange={(v) => updateStyle('textAlign', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left Align</SelectItem>
                  <SelectItem value="center">Center Align</SelectItem>
                  <SelectItem value="right">Right Align</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
