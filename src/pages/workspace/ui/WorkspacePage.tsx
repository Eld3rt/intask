import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui'
import { Folder } from 'lucide-react'

type Project = {
  id: string
  name: string
  description: string | null
}

type WorkspacePageProps = {
  projects: Project[]
}

function WorkspacePage({ projects }: WorkspacePageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Workspace</h1>
        <p className="text-muted-foreground">Manage your projects and tasks</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{project.name}</CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export { WorkspacePage }
