'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui'
import { EditProjectModal, DeleteProjectModal, InviteProjectModal } from '@/features/projects'
import { Folder, MoreVertical } from 'lucide-react'
import { Button } from '@/shared/ui'

type Project = {
  id: string
  name: string
  description: string | null
}

type ProjectCardProps = {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  return (
    <>
      <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
        <CardHeader>
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsInviteModalOpen(true)}>Invite</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Folder className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg pr-8">{project.name}</CardTitle>
          {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
        </CardHeader>
      </Card>
      <EditProjectModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} project={project} />
      <InviteProjectModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        projectId={project.id}
        projectName={project.name}
      />
      <DeleteProjectModal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} project={project} />
    </>
  )
}

export { ProjectCard }
export type { Project }
