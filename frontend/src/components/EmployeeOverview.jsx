import { useEffect, useMemo, useState } from 'react'
import { fetchAiTelemetry, fetchEmployees } from '../lib/api'

const REFRESH_INTERVAL = 5000

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    case 'normal':
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function EmployeeOverview() {
  const [employees, setEmployees] = useState([])
  const [aiInsights, setAiInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadData = async (isInitial = false) => {
      try {
        const [employeeData, telemetryData] = await Promise.all([
          fetchEmployees(),
          fetchAiTelemetry(),
        ])

        if (cancelled) return

        setEmployees(employeeData)
        setAiInsights(telemetryData)
        setError('')
      } catch (err) {
        if (cancelled) return
        console.error('Failed to refresh overview', err)
        setError(err.message || 'Unable to refresh overview data')
      } finally {
        if (!cancelled && isInitial) {
          setLoading(false)
        }
      }
    }

    loadData(true)

    const interval = setInterval(() => {
      loadData()
    }, REFRESH_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const liveRiskClass = useMemo(() => {
    if (!aiInsights?.burnoutRisk) return 'bg-gray-100 text-gray-700'
    if (aiInsights.burnoutRisk === 'High') return 'bg-red-100 text-red-700'
    if (aiInsights.burnoutRisk === 'Medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }, [aiInsights])

  if (loading) {
    return <div className="p-6">Loading overview...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Employee Overview</h2>
          <p className="text-sm text-gray-500">Auto-refreshing every {REFRESH_INTERVAL / 1000}s</p>
        </div>
        <div className="text-xs text-gray-400">
          Last updated: {aiInsights?.lastUpdated ? new Date(aiInsights.lastUpdated).toLocaleTimeString() : '—'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg shadow-sm p-5 space-y-2">
          <p className="text-xs uppercase text-gray-500">Live Burnout Risk</p>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${liveRiskClass}`}>
            {aiInsights?.burnoutRisk ?? 'Unknown'}
          </span>
          <p className="text-xs text-gray-400">Dominant expression: {aiInsights?.dominantExpression ?? '—'}</p>
          <p className="text-xs text-gray-400">Stress score: {aiInsights?.stressScore ?? '—'}</p>
        </div>
        <div className="bg-white border rounded-lg shadow-sm p-5">
          <p className="text-xs uppercase text-gray-500 mb-2">Recommendation</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {aiInsights?.recommendation ?? 'Telemetry not available yet.'}
          </p>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Employee</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Weekly Hrs</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Today's Hours</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-800">{employee.weeklyHours}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-800">{employee.todayHours} hrs</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClass(
                        employee.status
                      )}`}
                    >
                      {employee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EmployeeOverview

