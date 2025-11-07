import MetricCard from './MetricCard'
import BurnoutChart from './BurnoutChart'
import EmployeeTable from './EmployeeTable'

function Dashboard({ employees }) {
  return (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Employees"
          value="120"
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />

        <MetricCard
          title="High Burnout Risk"
          value="8 Employees"
          icon={
            <svg
              className="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
            </svg>
          }
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />

        <MetricCard
          title="Average Mood"
          value="7.6 / 10"
          icon={
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <circle cx="9" cy="10" r="1.5" fill="currentColor" />
              <circle cx="15" cy="10" r="1.5" fill="currentColor" />
              <path
                d="M9 14c0 1.5 1.5 3 3 3s3-1.5 3-3"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />

        <MetricCard
          title="Avg Weekly Hours"
          value="44 hrs"
          icon={
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      <BurnoutChart />

      <EmployeeTable employees={employees} />
    </div>
  )
}

export default Dashboard