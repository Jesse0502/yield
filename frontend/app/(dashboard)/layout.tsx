import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import ProtectedRoute from "@/components/auth/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-40 -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#312e81,transparent)] opacity-40 -z-10" />

        <div className="flex flex-col md:flex-row h-[100dvh] relative">
          <Sidebar />

          <div className="flex-1 flex flex-col md:ml-0 h-full md:min-h-0">
            <Header />

            <main className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 py-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

