import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateCardProps {
  icon: "lesson" | "chat"
  title: string
  description: string
  buttonText: string
  showButton?: boolean
}

export default function EmptyStateCard({
  icon,
  title,
  description,
  buttonText,
  showButton = true,
}: EmptyStateCardProps) {
  return (
    <div className="bg-[#111827] rounded-xl p-6 mb-4 flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-[#1a2234] flex items-center justify-center mb-3">
        {icon === "lesson" ? <LessonIcon /> : <MessageSquare size={24} className="text-gray-400" />}
      </div>

      <h3 className="font-semibold text-lg mb-1">{title}</h3>

      {description && <p className="text-gray-400 text-sm text-center mb-4">{description}</p>}

      {showButton && buttonText && (
        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full px-6">{buttonText}</Button>
      )}
    </div>
  )
}

function LessonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 5V3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7L19 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12H21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17L19 19" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 19V21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17L5 19" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12H5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7L5 5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

