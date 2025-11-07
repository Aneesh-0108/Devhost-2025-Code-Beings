function EmployeeOverview() {
  const employees = [
    { name: "Alice Johnson", weeklyHrs: 55, todayHrs: 7.5, status: "high" },
    { name: "Bob Eriksen", weeklyHrs: 38, todayHrs: 6.0, status: "low" },
    { name: "Clara Nilsson", weeklyHrs: 50, todayHrs: 8.0, status: "normal" },
    { name: "David Hansen", weeklyHrs: 44, todayHrs: 7.0, status: "normal" },
  ];

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "low":
        return "bg-green-100 text-green-800";
      case "normal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Employee Overview
      </h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Employee
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Weekly Hrs
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Today's Hours
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((employee, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {employee.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-800">
                    {employee.weeklyHrs}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-800">
                    {employee.todayHrs} hrs
                  </td>
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
  );
}

export default EmployeeOverview;
