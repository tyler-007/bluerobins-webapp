import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Chip from "@/components/chip";

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  duration: string;
  sessions: number;
  time: string;
  day: string;
  startDate: string;
  endDate: string;
  spotsLeft: number;
  price: number;
  isMentor?: boolean;
  onBuy?: () => void;
}

export default function ProjectCard({
  title,
  description,
  tags,
  duration,
  isMentor,
  sessions,
  time,
  day,
  startDate,
  endDate,
  spotsLeft,
  price,
  onBuy,
}: ProjectCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-[30%] max-w-sm flex flex-col justify-between ">
      <div>
        <h2 className="text-2xl font-bold mb-1">{title}</h2>

        <p className="text-gray-500 mb-3 text-base leading-snug line-clamp-2">
          <span>{description}</span>
        </p>
        <div className="flex gap-2 mb-4">
          {tags.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>

        <div className="grid grid-cols-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">{sessions} Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{startDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span>{day}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>{time}</span>
          </div>
        </div>

        <div className="text-base mb-2 mt-2">
          {/* Time duration :{" "} */}
          <span className="font-medium">
            {startDate} to {endDate}
          </span>
        </div>
        {!isMentor ? (
          <div className="flex items-center  gap-2 text-green-600 font-medium">
            <Users className="w-5 h-5" />
            <span>
              {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
            </span>
          </div>
        ) : (
          <div className="flex items-center  gap-2 font-medium">
            <Users className="w-5 h-5" />
            <span>8 Students</span>
            <div className="flex-1"></div>
            <span className="text-gray-500 text-sm">Price: ${price}</span>
          </div>
        )}
      </div>
      <div className="border-t pt-4 mt-2 flex flex-col gap-2">
        {!isMentor && (
          <div className="flex items-center justify-between">
            <span className="text-lg">Price:</span>
            <span className="text-2xl font-bold">${price}</span>
          </div>
        )}
        {isMentor ? (
          <Button className="w-full mt-2 text-lg py-6" onClick={onBuy}>
            Edit Details
          </Button>
        ) : (
          <>
            <Button className="w-full mt-2 text-lg py-6" onClick={onBuy}>
              Buy Package
            </Button>
            <Button variant="outline" className="w-full mt-2 text-lg py-6">
              View Details
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
