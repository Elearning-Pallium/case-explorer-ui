import { useState } from "react";
import { ChevronDown, ChevronUp, User, Activity, Home, Pill } from "lucide-react";
import type { PatientBaseline } from "@/lib/content-schema";
import { cn } from "@/lib/utils";

interface PatientHeaderProps {
  patient: PatientBaseline;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full bg-primary text-primary-foreground">
      <div className="container px-4">
        {/* Always visible: Name, Age, Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between py-3"
          aria-expanded={isExpanded}
          aria-controls="patient-details"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold">{patient.name}</h2>
              <p className="text-sm opacity-90">{patient.age} years old</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-75">
              {isExpanded ? "Hide details" : "Show details"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Expandable details */}
        <div
          id="patient-details"
          className={cn(
            "grid gap-4 overflow-hidden transition-all duration-300",
            isExpanded ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Diagnosis */}
              <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent p-3">
                <Activity className="h-5 w-5 mt-0.5 text-accent" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-75">Diagnosis</p>
                  <p className="text-sm font-medium">{patient.diagnosis}</p>
                </div>
              </div>

              {/* Living Situation */}
              <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent p-3">
                <Home className="h-5 w-5 mt-0.5 text-accent" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-75">Living Situation</p>
                  <p className="text-sm font-medium">{patient.livingSituation}</p>
                </div>
              </div>

              {/* PPS Score */}
              <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  %
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide opacity-75">PPS Score</p>
                  <p className="text-sm font-medium">{patient.ppsScore}%</p>
                </div>
              </div>

              {/* Additional Info */}
              {patient.additionalInfo && Object.keys(patient.additionalInfo).length > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-sidebar-accent p-3">
                  <Pill className="h-5 w-5 mt-0.5 text-accent" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-75">
                      {Object.keys(patient.additionalInfo)[0]}
                    </p>
                    <p className="text-sm font-medium">
                      {Object.values(patient.additionalInfo)[0]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
