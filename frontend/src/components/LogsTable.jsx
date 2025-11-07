import { useEffect, useState } from 'react'
import { getLogs, clearAllLogs } from '../services/api'

function LogsTable({ employeeId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = employeeId ? { employeeId } : {}
      const data = await getLogs(params)
      // Sort by timestamp, newest first
      const sortedLogs = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setLogs(sortedLogs)
      setError(null)
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError('Failed to fetch logs. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // Refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [employeeId])

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'bg-green-100 text-green-800',
      sad: 'bg-blue-100 text-blue-800',
      angry: 'bg-red-100 text-red-800',
      fearful: 'bg-purple-100 text-purple-800',
      disgusted: 'bg-yellow-100 text-yellow-800',
      surprised: 'bg-pink-100 text-pink-800',
      neutral: 'bg-gray-100 text-gray-800',
    }
    return colors[emotion] || colors.neutral
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const handleClearAll = async () => {
    try {
      setClearing(true)
      await clearAllLogs()
      setLogs([])
      setShowClearConfirm(false)
      setError(null)
    } catch (err) {
      console.error('Error clearing logs:', err)
      setError('Failed to clear logs. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading logs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Emotion Logs</h3>
        <div className="flex items-center gap-3">
          {logs.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={fetchLogs}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Clear All Logs?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete all {logs.length} emotion logs? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={clearing}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No emotion logs found. Start detection to begin logging emotions.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emotion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  All Expressions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr key={log._id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getEmotionColor(
                        log.emotion
                      )}`}
                    >
                      {log.emotion}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round((log.confidence || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-wrap gap-2">
                      {log.expressions &&
                        Object.entries(log.expressions)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emotion, value]) => (
                            <span
                              key={emotion}
                              className="text-xs bg-gray-100 px-2 py-1 rounded capitalize"
                            >
                              {emotion}: {Math.round(value * 100)}%
                            </span>
                          ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default LogsTable

