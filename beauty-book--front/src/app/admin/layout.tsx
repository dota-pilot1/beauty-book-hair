import { AdminSidebar } from "@/shared/ui/admin/AdminSidebar";
import { RequireAuth } from "@/widgets/guards/RequireAuth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1760px] gap-3 px-2 py-5 lg:px-3">
        <AdminSidebar />
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
