import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { fetchWorkloadBalance } from '../lib/api';

const WorkloadOverview = () => {
  const [workloadData, setWorkloadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadWorkloadData = async () => {
      try {
        setLoading(true);
        const data = await fetchWorkloadBalance();
        
        if (cancelled) return;

        setWorkloadData(data);
        setError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load workload data', err);
        setError(err.message || 'Unable to load workload data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadWorkloadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadWorkloadData, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Transform data for chart
  const chartData = workloadData?.doctors?.map((doctor) => {
    const isOverloaded = doctor.currentPatients > doctor.recommendedPatients;
    return {
      name: doctor.name || `Doctor ${doctor.doctorId}`,
      currentPatients: doctor.currentPatients,
      recommendedPatients: doctor.recommendedPatients,
      isOverloaded,
      department: doctor.department,
      burnoutScore: doctor.burnoutScore,
      status: doctor.status,
    };
  }) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">{data.department}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="font-medium">Current:</span>{' '}
              <span className={data.isOverloaded ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                {data.currentPatients} patients
              </span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Recommended:</span>{' '}
              <span className="text-blue-600">{data.recommendedPatients} patients</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Burnout Score:</span>{' '}
              <span className="text-gray-700">{data.burnoutScore?.toFixed(1) || 'N/A'}</span>
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className={`font-semibold ${
                data.status === 'Overloaded' ? 'text-red-600' :
                data.status === 'At Risk' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {data.status}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Workload Overview</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading workload data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Workload Overview</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!workloadData || !workloadData.doctors || workloadData.doctors.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Workload Overview</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No workload data available</p>
        </div>
      </div>
    );
  }

  const summary = workloadData.summary || {};
  const overloadedCount = chartData.filter(d => d.isOverloaded).length;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Workload Overview</h2>
        <p className="text-sm text-gray-600">
          Current vs Recommended Patient Load by Doctor
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Total Doctors</p>
          <p className="text-2xl font-bold text-blue-600">{summary.totalDoctors || 0}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Overloaded</p>
          <p className="text-2xl font-bold text-red-600">{overloadedCount}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Avg Patients</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.averagePatients?.toFixed(1) || '0'}
          </p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 uppercase tracking-wide">Total Patients</p>
          <p className="text-2xl font-bold text-yellow-600">{summary.totalPatients || 0}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              label={{ value: 'Number of Patients', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            <Bar
              dataKey="currentPatients"
              name="Current Patients"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOverloaded ? '#ef4444' : '#3b82f6'}
                />
              ))}
            </Bar>
            <Bar
              dataKey="recommendedPatients"
              name="Recommended Patients"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Overloaded (Current &gt; Recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Normal Load</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Recommended Target</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadOverview;

