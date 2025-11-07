function EmployeeTable({ employees = [] }) {
  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case 'High':
        return 'bg-red-100 text-red-800'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'Low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Employee
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Burnout Risk
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Recommendation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-800">
                  {employee.name}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRiskBadgeClass(
                      employee.risk
                    )}`}
                  >
                    {employee.risk}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 text-center">
                  {employee.recommendation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EmployeeTable

