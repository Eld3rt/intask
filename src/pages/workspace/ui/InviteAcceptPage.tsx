'use client'

import { useEffect, useState } from 'react'
import { AcceptInvitationModal } from '@/features/projects/ui/AcceptInvitationModal'
import { Card, CardHeader, CardTitle, CardDescription } from '@/shared/ui'
import { AlertCircle } from 'lucide-react'

type Invitation = {
  id: string
  email: string
  token: string
  status: 'pending' | 'accepted'
  expiresAt: Date
  project: {
    id: string
    name: string
    description: string | null
  }
}

type InviteAcceptPageProps = {
  invitation: Invitation | null
  error: string | null
  isAuthenticated: boolean
  userEmail: string | null
  token: string
}

function InviteAcceptPage({ invitation, error, isAuthenticated, userEmail, token }: InviteAcceptPageProps) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // If user is authenticated, email matches, and no error, show modal automatically
    if (isAuthenticated && userEmail && invitation && !error) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => {
        setShowModal(true)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, userEmail, invitation, error])

  if (error || !invitation) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription className="mt-2">{error || 'Invitation not found'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Project Invitation</CardTitle>
          <CardDescription className="mt-2">
            You&apos;ve been invited to join &quot;{invitation.project.name}&quot;
          </CardDescription>
          {invitation.project.description && (
            <CardDescription className="mt-2">{invitation.project.description}</CardDescription>
          )}
        </CardHeader>
      </Card>
      {isAuthenticated && userEmail && (
        <AcceptInvitationModal
          open={showModal}
          onOpenChange={setShowModal}
          invitation={invitation}
          token={token}
        />
      )}
    </div>
  )
}

export { InviteAcceptPage }
