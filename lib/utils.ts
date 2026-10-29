import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

export const TASK_STATUS = {
  pending: { label: "Pending", color: "text-yellow-400 bg-yellow-400/10" },
  in_progress: { label: "In Progress", color: "text-blue-400 bg-blue-400/10" },
  completed: { label: "Completed", color: "text-green-400 bg-green-400/10" },
} as const;

export const TASK_PRIORITY = {
  low: { label: "Low", color: "text-slate-400 bg-slate-400/10" },
  medium: { label: "Medium", color: "text-orange-400 bg-orange-400/10" },
  high: { label: "High", color: "text-red-400 bg-red-400/10" },
} as const;

export const LEAD_STATUS = {
  new: { label: "New", color: "text-blue-400 bg-blue-400/10" },
  contacted: { label: "Contacted", color: "text-yellow-400 bg-yellow-400/10" },
  qualified: { label: "Qualified", color: "text-purple-400 bg-purple-400/10" },
  converted: { label: "Converted", color: "text-green-400 bg-green-400/10" },
  lost: { label: "Lost", color: "text-red-400 bg-red-400/10" },
} as const;
