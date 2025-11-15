"use client"

import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Moon, Sun } from "lucide-react"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { Text_03 } from "@/components/ui/wave-text" // adjust path if file lives elsewhere

export default function Home() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("vibechat-dark-mode")
    setIsDark(saved === "true")
  }, [])

  const toggleDarkMode = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("vibechat-dark-mode", String(next))
  }

  return (
    <div className="min-h-screen relative text-slate-900">
      {/* HERO SECTION (shader + hero content) */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Shader background — full section, absolutely positioned */}
        <div className="absolute inset-0 -z-10">
          <ShaderAnimation />
        </div>

        {/* NAVBAR — toggle lives in nav but DOES NOT mutate hero styling */}
        <nav className="absolute top-0 left-0 right-0 z-20 border-b border-white/20 bg-black/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Vibetalk
            </div>

            {/* Toggle button — only flips non-hero color scheme */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              className="rounded-full p-2 hover:bg-white/10 transition"
            >
              {isDark ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
          </div>
        </nav>

        {/* HERO CONTENT — ALWAYS uses light/overlay styles (NOT affected by isDark) */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center text-white">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full animate-pulse bg-cyan-300" />
              <span className="text-sm font-medium text-white">Connect instantly with people worldwide</span>
            </div>
          </div>

          <header className="mb-6">
            {/* Use your animated per-character text for the brand/title */}
            <h1 className="text-6xl md:text-8xl font-black mb-4 leading-none">
              <Text_03 text="Vibetalk" className="text-6xl md:text-8xl" />
            </h1>

            {/* decorative underline */}
            <div className="h-1 w-32 mx-auto rounded-full bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300" />
          </header>

          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Connect. Chat.{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300">
              Vibe.
            </span>
          </h2>

          <p className="max-w-2xl text-lg md:text-xl text-white/80 mb-10">
            Meet random people through instant video chat. No bots, no endless swiping—just real conversations with real
            people. Vibetalk makes connecting fast, fun, and totally anonymous.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => navigate("/landing")}
              className="group relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-400/30"
            >
              <span className="flex items-center gap-2">
                Start Chatting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button
              variant="outline"
              className="px-8 py-6 text-lg font-bold rounded-lg transition-all duration-300 bg-white/10 border-2 border-purple-300/40 text-white hover:bg-white/20 hover:border-purple-300"
            >
              How it Works
            </Button>
          </div>
        </div>
      </section>

      {/* NON-HERO content: this area is controlled by the toggle */}
      <main className={isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: "⚡", title: "Instant Connect", desc: "Get matched with someone in seconds" },
                { icon: "🎥", title: "Crystal Quality", desc: "HD video & audio for real conversations" },
                { icon: "🔒", title: "Totally Private", desc: "Stay anonymous and skip whenever" },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700" : "bg-white/50 border-gray-200"}`}
                >
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-slate-100" : ""}`}>{f.title}</h3>
                  <p className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-3 gap-8 pt-12 border-t ${isDark ? "border-slate-700" : "border-gray-200"}`}>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                  50K+
                </div>
                <p className={`${isDark ? "text-slate-400" : "text-slate-600"} text-sm font-medium`}>Online Now</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                  1M+
                </div>
                <p className={`${isDark ? "text-slate-400" : "text-slate-600"} text-sm font-medium`}>Monthly Users</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-purple-600">
                  100%
                </div>
                <p className={`${isDark ? "text-slate-400" : "text-slate-600"} text-sm font-medium`}>Anonymous</p>
              </div>
            </div>
          </div>
        </section>
      </main>
     {/* FOOTER */}
<footer className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-100 text-slate-700"}>
  <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col items-center gap-6">

    {/* Name */}
    <h3 className="text-lg font-semibold tracking-wide">
      Built by <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">Omkar Chavan</span>
    </h3>

    {/* Social Icons */}
    <div className="flex items-center gap-6">
      
      {/* Instagram */}
      <a
        href="https://www.instagram.com/its.omkarr_/"
        target="_blank"
        className="hover:scale-110 transition-transform"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z" />
          <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
          <circle cx="17.5" cy="6.5" r="1.5" />
        </svg>
      </a>

      {/* YouTube */}
      <a
        href="https://www.youtube.com/@omkarchavan237"
        target="_blank"
        className="hover:scale-110 transition-transform"
      >
        <svg
          className="w-8 h-8"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.5 6.2s-.2-1.7-.8-2.4c-.7-.8-1.6-.8-2-0.9C17.2 2.5 12 2.5 12 2.5h-.1s-5.2 0-8.7.4C3 3 2 3 1.3 3.8.7 4.5.6 6.2.6 6.2S0 8.1 0 10v3.9c0 1.9.6 3.8.6 3.8s.2 1.7.8 2.4c.7.8 1.6.8 2 0.9 2.5.2 10.6.4 10.6.4s5.2 0 8.7-.4c.4-.1 1.3-.1 2-0.9.6-.7.8-2.4.8-2.4s.6-1.9.6-3.8V10c0-1.9-.6-3.8-.6-3.8zM9.5 15.5v-7L16 12l-6.5 3.5z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href="https://www.linkedin.com/in/omkar-chavan-8b59a8334/"
        target="_blank"
        className="hover:scale-110 transition-transform"
      >
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zm7 0h3.8v2.2h.1c.5-.9 1.8-2.2 3.9-2.2C20.4 8 24 10.5 24 16v8h-4v-7c0-1.7-.03-3.8-2.3-3.8-2.3 0-2.7 1.8-2.7 3.6V24h-4V8z" />
        </svg>
      </a>

      {/* GitHub */}
      <a
        href="https://github.com/Omkar-XD"
        target="_blank"
        className="hover:scale-110 transition-transform"
      >
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5V20c-3.2.7-3.9-1.5-3.9-1.5-.6-1.3-1.4-1.7-1.4-1.7-1.1-.8.1-.8.1-.8 1.2.1 1.9 1.2 1.9 1.2 1 1.9 2.7 1.4 3.3 1.1.1-.7.4-1.4.8-1.7-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.3a11.4 11.4 0 0 1 6.2 0c2.3-1.6 3.3-1.3 3.3-1.3.6 1.7.2 3-.1 3.3.8.9 1.2 2 1.2 3.3 0 4.6-2.7 5.6-5.3 5.9.5.5.9 1.3.9 2.6v3.9c0 .3.2.6.8.5A10.9 10.9 0 0 0 23.5 12c0-6.3-5.2-11.5-11.5-11.5z" />
        </svg>
      </a>
    </div>

    <p className="text-sm opacity-60 text-center">
      © {new Date().getFullYear()} Vibetalk • All rights reserved.
    </p>
  </div>
</footer>


    </div>
  )
}
