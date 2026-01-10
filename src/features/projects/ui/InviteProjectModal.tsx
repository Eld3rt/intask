'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui'
import { Button } from '@/shared/ui'
import { Input } from '@/shared/ui'
import { Label } from '@/shared/ui'
import { sendInvitations } from '../api/send-invitations'
import { X } from 'lucide-react'

type InviteProjectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

function InviteProjectModal({ open, onOpenChange, projectId, projectName }: InviteProjectModalProps) {
  const router = useRouter()
  const [emails, setEmails] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const addEmailField = () => {
    setEmails([...emails, ''])
  }

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Filter out empty emails and trim them
    const validEmails = emails.map(email => email.trim()).filter(email => email.length > 0)

    if (validEmails.length === 0) {
      setError('Please enter at least one email address')
      setIsSubmitting(false)
      return
    }

    try {
      const result = await sendInvitations({
        projectId,
        emails: validEmails,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(`Successfully sent ${result.invitations} invitation${result.invitations !== 1 ? 's' : ''}`)
      if (result.errors && result.errors.length > 0) {
        setError(`Some invitations failed: ${result.errors.join(', ')}`)
      }

      // Reset form and close modal after a brief delay
      setTimeout(() => {
        setEmails([''])
        setError(null)
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error sending invitations:', error)
      setError('Failed to send invitations')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEmails([''])
      setError(null)
      setSuccess(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite to Project</DialogTitle>
          <DialogDescription>
            Send invitation emails to collaborate on &quot;{projectName}&quot;. Multiple emails can be added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <div className="grid gap-2">
              <Label htmlFor="emails">Email Addresses</Label>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      id={`email-${index}`}
                      type="email"
                      value={email}
                      onChange={e => updateEmail(index, e.target.value)}
                      placeholder="user@example.com"
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    {emails.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEmailField(index)}
                        disabled={isSubmitting}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove email</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addEmailField}
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                Add Another Email
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || emails.every(email => email.trim().length === 0)}>
              {isSubmitting ? 'Sending...' : 'Send Invitations'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { InviteProjectModal }
