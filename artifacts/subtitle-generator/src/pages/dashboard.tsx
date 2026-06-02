import { useState, useEffect } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Film, Clock, Search, Trash2 } from "lucide-react";
import { getProjects, deleteProject, type Project } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");

  function reload() {
    setProjects(getProjects());
  }

  useEffect(() => {
    reload();
  }, []);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this project? This cannot be undone.")) {
      deleteProject(id);
      reload();
    }
  }

  const filtered = query.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : projects;

  const totalSegments = projects.reduce((sum, p) => sum + p.segments.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SubGen</h1>
            <p className="text-muted-foreground text-sm mt-1">Professional Caption Studio</p>
          </div>
          <Link href="/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSegments}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Saved locally in browser</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8 bg-card/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/50 rounded-xl bg-card/10">
              <Film className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">
                {query ? "No projects match your search" : "No projects yet"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {query ? "Try a different search term" : "Create your first project to get started"}
              </p>
              {!query && (
                <Link href="/new">
                  <Button variant="outline">Create Project</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group cursor-pointer hover:border-primary/50 transition-colors bg-card/50 border-border/50 relative">
                    <button
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                      onClick={(e) => handleDelete(e, project.id)}
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors pr-6">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-1">{project.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(project.updatedAt), "MMM d, yyyy")}
                        </span>
                        <span>{project.segments.length} segment{project.segments.length !== 1 ? "s" : ""}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
