import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getInvitationByToken } from '@/features/projects/api/get-invitation-by-token'
import { InviteAcceptPage } from '@/pages/workspace/ui/InviteAcceptPage'

type InvitePageProps = {
  searchParams: Promise<{ project?: string }>
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const params = await searchParams
  const token = params.project

  if (!token) {
    redirect('/workspace?error=missing_token')
  }

  // Check if user is authenticated
  const { userId } = await auth()
  const user = await currentUser()

  // Get invitation by token
  const invitationResult = await getInvitationByToken(token)

  if (invitationResult.error || !invitationResult.invitation) {
    return (
      <InviteAcceptPage
        invitation={null}
        error={invitationResult.error || 'Invitation not found'}
        isAuthenticated={!!userId}
        userEmail={user?.emailAddresses[0]?.emailAddress || null}
        token={token}
      />
    )
  }

  const invitation = invitationResult.invitation

  // If user is not authenticated, redirect to login with return URL
  if (!userId || !user) {
    const returnUrl = encodeURIComponent(`/workspace/invite?project=${token}`)
    redirect(`/sign-in?redirect_url=${returnUrl}`)
  }

  // Get user email
  const userEmail = user.emailAddresses[0]?.emailAddress

  if (!userEmail) {
    return (
      <InviteAcceptPage
        invitation={invitation}
        error="User email not found"
        isAuthenticated={true}
        userEmail={null}
        token={token}
      />
    )
  }

  // Check if email matches invitation
  const normalizedUserEmail = userEmail.toLowerCase().trim()
  const normalizedInvitationEmail = invitation.email.toLowerCase().trim()

  if (normalizedUserEmail !== normalizedInvitationEmail) {
    return (
      <InviteAcceptPage
        invitation={invitation}
        error="Your email does not match the invitation email"
        isAuthenticated={true}
        userEmail={userEmail}
        token={token}
      />
    )
  }

  // User is authenticated and email matches - show accept modal
  return (
    <InviteAcceptPage invitation={invitation} error={null} isAuthenticated={true} userEmail={userEmail} token={token} />
  )
}
