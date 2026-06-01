import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Film, Clock, Search } from "lucide-react";
import { useListProjects, useGetProjectsStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetProjectsStats();
  const { data: projects, isLoading: projectsLoading } = useListProjects();

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
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{stats?.totalProjects || 0}</div>}
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Segments</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{stats?.totalSegments || 0}</div>}
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">All systems operational</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-8 bg-card/50" />
            </div>
          </div>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/50 rounded-xl bg-card/10">
              <Film className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project to get started</p>
              <Link href="/new">
                <Button variant="outline">Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="group cursor-pointer hover:border-primary/50 transition-colors bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                      {project.description && <CardDescription className="line-clamp-1">{project.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
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
