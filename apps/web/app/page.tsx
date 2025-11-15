import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Brikx PvE Analyzer
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Analyseer Programma van Eisen documenten en converteer naar Brikx-compatible data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/upload"
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600">Upload</h2>
            <p className="text-gray-600">
              Upload PvE documenten (PDF, DOCX, TXT) voor extractie
            </p>
          </Link>

          <Link
            href="/overview"
            className="group p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600">Overview</h2>
            <p className="text-gray-600">
              Bekijk alle projecten, statistieken en status
            </p>
          </Link>

          <div className="p-8 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-4xl mb-4">🔧</div>
            <h2 className="text-2xl font-semibold mb-2">Settings</h2>
            <p className="text-gray-600">
              Feature flags en Brikx export configuratie
            </p>
          </div>
        </div>

        <div className="mt-16 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              API: Ready
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Database: Ready
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Brikx Export: Configured via feature flags
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
