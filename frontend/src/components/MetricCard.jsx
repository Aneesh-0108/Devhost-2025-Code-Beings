function MetricCard({ title, value, icon, iconBgColor, iconColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  )
}

export default MetricCard

