import React, { useState, useRef, useEffect } from "react"
import { useAuthStore } from "../store/authStore"
import { LogOut, User, Settings } from "lucide-react"

export default function UserButton() {
  const { user, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const email = user.email || ""
  const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0]
  const initials = name.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-[#E8B86D] to-[#D4A853] text-[#141311] font-bold text-sm tracking-wider cursor-pointer hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-[#E8B86D]/15 hover:shadow-[#E8B86D]/25 focus:outline-none border border-[#E8B86D]/20"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-white/10 bg-[#2C2927] p-1.5 shadow-2xl z-50 animate-in fade-in-50 slide-in-from-top-3 duration-200">
          <div className="px-3.5 py-3 border-b border-white/10 space-y-0.5">
            <p className="text-xs font-semibold text-[#F9F8F6] truncate">{name}</p>
            <p className="text-[10px] font-medium text-[#94A3B8] truncate">{email}</p>
          </div>

          <div className="py-1 space-y-0.5">
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#D4D1CA] font-medium hover:bg-white/5 hover:text-[#F9F8F6] transition-all text-left border border-transparent hover:border-white/5 active:scale-[0.98] cursor-pointer">
              <User className="h-3.5 w-3.5 text-[#E8B86D]/70" />
              <span>Profile Settings</span>
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#D4D1CA] font-medium hover:bg-white/5 hover:text-[#F9F8F6] transition-all text-left border border-transparent hover:border-white/5 active:scale-[0.98] cursor-pointer">
              <Settings className="h-3.5 w-3.5 text-[#E8B86D]/70" />
              <span>Preferences</span>
            </button>
          </div>

          <div className="pt-1.5 border-t border-white/10">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-[#F87171] bg-transparent border border-transparent hover:bg-[#3B1816] hover:border-[#F87171]/20 transition-all text-left font-semibold active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
