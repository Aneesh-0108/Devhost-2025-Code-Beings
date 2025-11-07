function BurnoutChart() {
  const chartData = [
    { label: 'Low', height: '180px', color: 'bg-yellow-300' },
    { label: 'Medium', height: '120px', color: 'bg-blue-300' },
    { label: 'High', height: '60px', color: 'bg-green-300' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Burnout Distribution
      </h2>
      <div className="flex items-end justify-center gap-8 h-64">
        {chartData.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={`w-20 ${item.color} rounded-t-lg transition-all`}
              style={{ height: item.height }}
            ></div>
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BurnoutChart

