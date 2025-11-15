"use client"

import { useEffect, useRef, useState } from "react"
import { Room } from "./Room"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

type Props = {}

const Landing = (props: Props) => {
  const [name, setName] = useState("")
  const [joined, setJoined] = useState(false)
  const [localMediaTrack, setLocalMediaTrack] = useState<MediaStreamTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const navigate = useNavigate()

  const getCam = async () => {
    setPermissionError(null)
    setPermissionRequested(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      })

      const videoTrack = stream.getVideoTracks()[0] ?? null
      const audioTrack = stream.getAudioTracks()[0] ?? null

      setLocalMediaTrack(videoTrack)
      setLocalAudioTrack(audioTrack)

      if (videoRef.current && videoTrack) {
        try {
          videoRef.current.srcObject = new MediaStream([videoTrack])
          // ensure attributes for mobile autoplay
          videoRef.current.muted = true
          videoRef.current.playsInline = true
          await videoRef.current.play().catch(() => {
            /* autoplay can be blocked; that's OK — user can still Start Chat after enabling */
          })
        } catch (err) {
          console.error("Error assigning preview stream:", err)
        }
      }
    } catch (err: any) {
      console.error("getUserMedia error:", err)
      setPermissionError(
        err && err.name === "NotAllowedError"
          ? "Camera / mic permission denied. Allow access in your browser settings."
          : "Unable to access camera / mic. Check device settings."
      )
      setLocalMediaTrack(null)
      setLocalAudioTrack(null)
    }
  }

  // Try quick permission hint on mount (don't auto-prompt — user must click "Enable Camera")
  useEffect(() => {
    // no auto prompt; just a hint flag if we want to show button
  }, [])

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 p-6 relative">
        {/* BACK BUTTON - high z-index, pointer events enabled */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-purple-500/20 transition-colors group z-50 pointer-events-auto"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6 text-white group-hover:text-purple-400 transition-colors" />
        </button>

        {/* decorative blobs (non-interactive) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              Ready to Connect?
            </h1>

            {/* camera preview */}
            <div className="mb-6 rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-black relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 z-10 pointer-events-none"></div>
              <div className="relative aspect-square bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full z-20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">
                  {localMediaTrack ? "Camera is on" : "Camera is off"}
                </span>
              </div>
            </div>

            {/* permission controls */}
            <div className="mb-6 flex flex-col gap-3">
              {!localMediaTrack ? (
                <>
                  <p className="text-sm text-gray-300 text-center">
                    Click <b>Enable Camera</b> to allow camera & mic preview before starting the chat.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={getCam}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl text-lg"
                    >
                      Enable Camera
                    </Button>
                    <Button
                      onClick={() => {
                        // allow user to proceed without camera (optional)
                        setLocalMediaTrack(null)
                        setLocalAudioTrack(null)
                        // still enable Start Video Chat if you want to allow audio-only; currently Start is disabled until media present
                      }}
                      className="px-4 py-3 rounded-xl border border-white/10 bg-transparent text-white"
                    >
                      Skip
                    </Button>
                  </div>
                  {permissionRequested && permissionError && (
                    <div className="text-sm text-red-400 mt-2 text-center">{permissionError}</div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-300 text-center">Preview ready — Start the chat when you’re ready.</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Enter your name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full bg-white/5 border-2 border-purple-500/20 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
                />
              </div>

              <Button
                onClick={() => setJoined(true)}
                disabled={!localMediaTrack || !localAudioTrack}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 rounded-xl text-lg shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/75 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Video Chat
              </Button>
            </div>

            <p className="text-center text-gray-500 text-sm mt-6">
              By continuing, you accept our terms of service and privacy policy
            </p>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        `}</style>
      </div>
    )
  }

  return <Room name={name} localAudioTrack={localAudioTrack} localMediaTrack={localMediaTrack} />
}

export default Landing
