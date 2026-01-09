import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { WorkspacePage } from '@/pages/workspace'
import { getUserProjects, ensureDefaultProject } from '@/entities/projects'

export default async function Workspace() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Ensure user has a default project if they have no projects
  await ensureDefaultProject(userId)

  // Fetch user's projects
  const projects = await getUserProjects(userId)

  return <WorkspacePage projects={projects} />
}
