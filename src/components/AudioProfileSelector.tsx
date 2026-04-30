"use client";

import { AudioProfile, audioProfileLabels } from "@/lib/types";

type AudioProfileSelectorProps = {
  profile: AudioProfile;
  onChange: (profile: AudioProfile) => void;
};

const profiles: AudioProfile[] = ["soft", "choir", "deep"];

export function AudioProfileSelector({
  profile,
  onChange,
}: AudioProfileSelectorProps) {
  return (
    <div className="omna-audio-profile" aria-label="Тон звука">
      <span>Тон</span>
      <div>
        {profiles.map((nextProfile) => {
          const active = profile === nextProfile;

          return (
            <button
              key={nextProfile}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(nextProfile)}
              className={active ? "omna-audio-profile-active" : ""}
            >
              {audioProfileLabels[nextProfile]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
