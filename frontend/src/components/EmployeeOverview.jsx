import { useEffect, useState } from 'react';
import { fetchEmployees } from '../lib/api';

const POLLING_INTERVAL = 15000; // 15 seconds

export default function EmployeeOverview() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const employeeData = await fetchEmployees();
      setEmployees(employeeData);
      setError('');
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        setLoading(true);
        await fetchData();
      }
    };

    // Initial load
    loadData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        fetchData();
      }
    }, POLLING_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getBurnoutBadgeClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBurnoutBadgeText = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'high':
        return 'High Risk';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      default:
        return status || 'Unknown';
    }
  };

  // Show only first 6 employees
  const displayedEmployees = employees.slice(0, 6);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Burnout Overview</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Burnout Overview</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Employee Burnout Overview</h2>

      {displayedEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEmployees.map((employee) => (
            <div
              key={employee.id || employee._id || employee.email}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            >
              {/* Employee Name */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{employee.name || 'Unknown'}</h3>
              </div>

              {/* Hours Information */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Weekly Hours</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {employee.weeklyHours !== undefined ? `${employee.weeklyHours}h` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today Hours</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {employee.todayHours !== undefined ? `${employee.todayHours}h` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Burnout Risk Badge */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Burnout Risk</span>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getBurnoutBadgeClass(
                      employee.status
                    )}`}
                  >
                    {getBurnoutBadgeText(employee.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
