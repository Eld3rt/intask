type Project = {
  id: string
  slug: string
  name: string
  description: string | null
}

type ProjectBoardPageProps = {
  project: Project
}

function ProjectBoardPage({ project }: ProjectBoardPageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">{project.name}</h1>
        {project.description && <p className="text-muted-foreground">{project.description}</p>}
      </div>
    </div>
  )
}

export { ProjectBoardPage }
export type { Project }
