export default function Sidebar() {
  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 min-h-screen p-5 text-gray-800">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-bold">
          PBL
        </div>
        <span className="font-semibold text-lg text-gray-900">
          Mentor Hub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 text-sm">

        <div className="bg-blue-100 text-blue-600 p-3 rounded-md font-semibold">
          📊 Overview
        </div>

        <div className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700">
          👥 My Mentees
        </div>

        <div className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700">
          🚀 Projects
        </div>

        <div className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700">
          📋 Weekly Reviews
        </div>

        <div className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700">
          📅 Schedule
        </div>

        <div className="p-3 hover:bg-gray-100 rounded-md cursor-pointer text-gray-700">
          ⚙️ Settings
        </div>

      </nav>

    </aside>
  )
}