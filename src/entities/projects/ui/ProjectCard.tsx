import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui'
import { Folder } from 'lucide-react'

type Project = {
  id: string
  name: string
  description: string | null
}

type ProjectCardProps = {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
  )
}

export { ProjectCard }
export type { Project }
