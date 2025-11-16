"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, SkipForward, LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

const URL = "https://vibe-chat-backend-1.onrender.com/";

export const Room = ({
  name,
  localAudioTrack,
  localMediaTrack,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localMediaTrack: MediaStreamTrack | null;
}) => {
  const [socket, setSocket] = useState<null | Socket>(null);
  const [lobby, setLobby] = useState(true);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [messages, setMessages] = useState<{ text: string; self: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const navigate = useNavigate();

  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);

  // Dark mode (affects non-hero areas only, as requested)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("vibechat-dark-mode") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("vibechat-dark-mode", String(isDark));
    } catch {}
  }, [isDark]);

  // --- Additional UI state for resizing the chat area (GREEN)
  const [chatHeight, setChatHeight] = useState<number>(384); // default chat panel height
  const resizingRef = useRef(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(chatHeight);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const dy = startYRef.current - e.clientY;
      const newH = Math.max(200, startHeightRef.current + dy); // min height 200
      setChatHeight(newH);
    };
    const onMouseUp = () => {
      resizingRef.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    if (resizingRef.current) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    resizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = chatHeight;
    document.body.style.cursor = "row-resize";
  };

  // --- Socket & WebRTC logic (kept intact, unchanged except for small logs)
  useEffect(() => {
    if (!name) return;

    const sock = io(URL, { query: { name } });
    setSocket(sock);

    sock.on("connect", () => console.log("Connected to server:", sock.id));

    sock.on("send-offer", async ({ roomId }) => {
      roomIdRef.current = roomId;
      setLobby(false);
      setConnectedUser("stranger");

      const newPc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = newPc;

      newPc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          let stream = remoteVideoRef.current.srcObject as MediaStream;
          if (!stream) {
            stream = new MediaStream();
            remoteVideoRef.current.srcObject = stream;
          }
          stream.addTrack(event.track);
          remoteVideoRef.current.play().catch(console.error);
        }
      };

      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit("add-ice-candidate", {
            candidate: event.candidate,
            roomId,
            senderSocketId: sock.id,
          });
        }
      };

      if (localMediaTrack) newPc.addTrack(localMediaTrack);
      if (localAudioTrack) newPc.addTrack(localAudioTrack);

      const offer = await newPc.createOffer();
      await newPc.setLocalDescription(offer);
      sock.emit("offer", { roomId, sdp: offer, senderSocketId: sock.id });
    });

    sock.on("offer", async ({ roomId, sdp }) => {
      roomIdRef.current = roomId;
      setLobby(false);
      setConnectedUser("stranger");

      const newPc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = newPc;

      newPc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(console.error);
        }
      };

      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          sock.emit("add-ice-candidate", {
            candidate: event.candidate,
            roomId,
            senderSocketId: sock.id,
          });
        }
      };

      if (localMediaTrack) newPc.addTrack(localMediaTrack);
      if (localAudioTrack) newPc.addTrack(localAudioTrack);

      await newPc.setRemoteDescription(sdp);
      for (const candidate of pendingIceCandidates.current) {
        await newPc.addIceCandidate(candidate).catch(console.error);
      }
      pendingIceCandidates.current = [];

      const answer = await newPc.createAnswer();
      await newPc.setLocalDescription(answer);
      sock.emit("answer", { roomId, sdp: answer, senderSocketId: sock.id });
    });

    sock.on("answer", async ({ sdp }) => {
      const pc = pcRef.current;
      if (pc) {
        await pc.setRemoteDescription(sdp);
        for (const candidate of pendingIceCandidates.current) {
          await pc.addIceCandidate(candidate).catch(console.error);
        }
        pendingIceCandidates.current = [];
      }
    });

    sock.on("add-ice-candidate", async ({ candidate, senderSocketId }) => {
      const pc = pcRef.current;
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate).catch(console.error);
      } else {
        pendingIceCandidates.current.push(candidate);
      }
    });

    sock.on("receive-message", ({ message }) => {
      setMessages((prev) => [...prev, { text: message, self: false }]);
    });

    sock.on("user-disconnected", () => {
      setLobby(true);
      setConnectedUser(null);
      setMessages([]);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      pendingIceCandidates.current = [];
    });

    sock.on("room-ready", ({ roomId }) => {
      roomIdRef.current = roomId;
    });

    return () => {
      sock.disconnect();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [name, localAudioTrack, localMediaTrack]);

  useEffect(() => {
    if (localVideoRef.current && localMediaTrack) {
      const stream = new MediaStream([localMediaTrack]);
      if (localAudioTrack) stream.addTrack(localAudioTrack);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localMediaTrack, localAudioTrack]);

  const handleNext = () => {
    if (socket && roomIdRef.current) {
      socket.emit("next-user", { roomId: roomIdRef.current });
    }
    setLobby(true);
    setConnectedUser(null);
    setMessages([]);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingIceCandidates.current = [];
  };

  const handleLeave = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    socket?.disconnect();
    navigate("/");
  };

  const sendMessage = () => {
    if (!roomIdRef.current || !socket || !input.trim()) return;
    socket.emit("chat-message", {
      roomId: roomIdRef.current,
      message: input,
      senderSocketId: socket.id,
    });
    setMessages((prev) => [...prev, { text: input, self: true }]);
    setInput("");
  };

  // UI classes dependant on dark mode
  const containerClass = isDark ? "min-h-screen bg-slate-900 text-slate-100 p-6" : "min-h-screen bg-white text-slate-900 p-6";

  return (
  <div className={isDark ? "min-h-screen bg-slate-900 text-slate-100 p-6" : "min-h-screen bg-white text-slate-900 p-6"}>
    {/* TOP NAV: logo on left, toggle on right (no uhmegle, no online count) */}
    <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-r from-purple-500 to-blue-400 flex items-center justify-center text-white font-black text-lg">
          V
        </div>
        <h1 className="text-2xl font-bold">Vibetalk</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className={isDark ? "flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10" : "flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200"}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm">
            {connectedUser ? "Connected" : lobby ? "Searching..." : "Connecting..."}
          </span>
        </div>

        <button
          onClick={() => setIsDark((s) => !s)}
          className={isDark ? "p-2 rounded-full bg-white/8 hover:bg-white/12 transition" : "p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        <Button
          onClick={handleLeave}
          className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 py-2"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave
        </Button>
      </div>
    </div>

    {/* MAIN GRID: left = videos, right = chat panel */}
    <div className="max-w-7xl mx-auto grid lg:grid-cols-[420px_1fr] gap-6">
      {/* LEFT COLUMN: stacked videos */}
      <div className="space-y-6">
        <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? "border-purple-600/20 bg-black/60" : "border-gray-200 bg-white"}`}>
          <div className="relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video object-cover bg-black"
            />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded-full text-sm">
              You
            </div>
          </div>
        </div>

        <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? "border-blue-400/15 bg-black/60" : "border-gray-200 bg-white"}`}>
          <div className="relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover bg-gray-900"
            />
            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 rounded-full text-sm">
              {connectedUser ? "Stranger" : "Waiting..."}
            </div>

            {lobby && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-300">Searching for stranger...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: BIG chat panel (tall, input fixed at bottom). Next button placed bottom-left inside this panel */}
      <div>
        {/* Chat Panel: fixed height relative to viewport so user doesn't need to scroll page */}
        <div
          className={`rounded-2xl border-2 relative flex flex-col mx-auto`}
          style={{
            height: "calc(100vh - 220px)", // <- tweak this number if you have larger header/footer
            borderColor: isDark ? "rgba(148,163,184,0.08)" : undefined,
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : undefined,
            overflow: "hidden",
          }}
        >
          {/* Messages area - scrollable */}
          <div className="flex-1 overflow-y-auto p-6" style={{ paddingBottom: 110 }}>
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Start a conversation...
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`max-w-xs p-3 rounded-xl text-sm mb-3 ${msg.self ? "ml-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white" : "bg-white/10 text-white/90"}`}>
                  {msg.text}
                </div>
              ))
            )}
          </div>

          {/* Input bar + Next control — fixed bottom inside chat panel */}
          <div className="absolute left-0 right-0 bottom-0 p-4 border-t bg-transparent" style={{ borderTopColor: isDark ? "rgba(148,163,184,0.06)" : undefined }}>
            <div className="flex items-center gap-3">
              {/* NEXT button moved here (visible when in lobby or always if you prefer) */}
              <div className="flex-shrink-0">
                <Button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <SkipForward className="w-4 h-4 mr-2 inline-block" />
                  Next
                </Button>
              </div>

              {/* Input */}
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="w-full rounded-full bg-white/10 text-white placeholder:text-white/60 border-none"
                  // style tweak so the input looks like your target UI
                />
              </div>

              {/* Send button */}
              <div className="flex-shrink-0">
                <Button onClick={sendMessage} className="ml-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

};

export default Room;
