export default function Topbar() {

  return (
    <div className="h-[60px] bg-white border-b flex items-center justify-between px-6">

      <div>
        <div className="font-semibold text-lg">
          Good Morning 👋
        </div>
        <div className="text-xs text-gray-500">
          Here's your PBL overview for today
        </div>
      </div>

      <div className="flex items-center gap-4">

        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
          {new Date().toDateString()}
        </div>

        <div className="bg-gray-100 w-8 h-8 flex items-center justify-center rounded-md">
          🔔
        </div>

      </div>

    </div>
  )
}