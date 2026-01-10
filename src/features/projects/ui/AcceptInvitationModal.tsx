'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { acceptInvitation } from '../api/accept-invitation'

type Project = {
  id: string
  name: string
  description: string | null
}

type Invitation = {
  id: string
  email: string
  token: string
  status: 'pending' | 'accepted'
  expiresAt: Date
  project: Project
}

type AcceptInvitationModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitation: Invitation
  token: string
}

function AcceptInvitationModal({ open, onOpenChange, invitation, token }: AcceptInvitationModalProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setIsAccepting(true)
    setError(null)

    try {
      const result = await acceptInvitation({ token })

      if (result.error) {
        setError(result.error)
        setIsAccepting(false)
        return
      }

      // Success - redirect to workspace
      router.push('/workspace')
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
      setIsAccepting(false)
    }
  }

  const handleCancel = () => {
    if (!isAccepting) {
      onOpenChange(false)
      router.push('/workspace')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accept Invitation</DialogTitle>
          <DialogDescription>
            You&apos;ve been invited to join the project <strong>&quot;{invitation.project.name}&quot;</strong>.
            Would you like to accept this invitation?
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive px-6">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isAccepting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AcceptInvitationModal }
