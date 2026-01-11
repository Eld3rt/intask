import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <img src="/images/logo.png" alt="intask" width={32} height={32} className="h-6 w-auto" />
              </Link>
              <Link href="/workspace" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Projects
              </Link>
            </div>
            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
