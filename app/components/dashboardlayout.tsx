import Sidebar from "./sidebar"
import Topbar from "./topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex bg-[#f5f4f0] min-h-screen">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Top Navigation */}
        <Topbar />

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  )
}