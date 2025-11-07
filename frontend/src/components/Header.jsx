function Header() {
  return (
    <header className="flex items-center justify-between p-6 border-b border-gray-200">
      <h1 className="text-2xl font-semibold text-gray-800">WorkWell AI</h1>
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-gray-600"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    </header>
  )
}

export default Header

