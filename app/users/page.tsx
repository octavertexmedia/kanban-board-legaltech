import { UserManagement } from "@/components/users/user-management"
import { PageShell } from "@/components/layout/page-shell"

export default function UsersPage() {
  return (
    <PageShell>
      <UserManagement />
    </PageShell>
  )
}
