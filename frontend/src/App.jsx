import React, { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20">
              G
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                GitHub Profile Health Auditor
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                v1.0.0-beta
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 flex-grow flex flex-col items-center justify-center text-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Audit Your GitHub Profile<br />Like a Recruiter Would
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Scan your public repositories for credential leaks, structural issues, and code smells. Get a synthesized AI report and an actionable health score in minutes.
          </p>
          <div className="p-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 inline-block">
            <div className="bg-slate-900 px-8 py-4 rounded-xl font-medium text-slate-300">
              🚀 Frontend Skeleton is Ready
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} GitHub Profile Health Auditor. All rights reserved.
      </footer>
    </div>
  )
}

export default App
