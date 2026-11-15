import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Check } from "lucide-react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface VoiceBridgeProps {
  open: boolean;
  onTranscriptCommit: (transcript: string) => void;
  onClose: () => void;
}

export default function VoiceBridge({
  open,
  onTranscriptCommit,
  onClose,
}: VoiceBridgeProps) {
  const [voiceNotice, setVoiceNotice] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const stopHardware = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Already stopped
    }
    recognitionRef.current = null;
  }, []);

  const startHardware = useCallback(() => {
    const speechCtor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (typeof speechCtor !== "function") {
      setVoiceNotice("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const rec = new (speechCtor as new () => SpeechRecognitionInstance)();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let assembled = "";
        for (let i = 0; i < event.results.length; i += 1) {
          assembled += event.results[i][0].transcript;
        }
        if (assembled.trim()) {
          onTranscriptCommit(assembled.trim());
        }
      };

      rec.onerror = (ev) => {
        if (ev.error !== "aborted" && ev.error !== "no-speech") {
          setVoiceNotice(`Speech error: ${ev.error}`);
        }
      };

      rec.onend = () => {
        recognitionRef.current = null;
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      setVoiceNotice(err instanceof Error ? err.message : "Speech access denied.");
    }
  }, [onTranscriptCommit]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        startHardware();
      }, 0);
      return () => {
        clearTimeout(timer);
        stopHardware();
      };
    }
    stopHardware();
    return undefined;
  }, [open, startHardware, stopHardware]);

  if (!open) return null;

  return (
    <div className="mb-2 flex h-8 items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-3 text-xs text-primary shadow-xs transition-all">
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <Mic className="size-3.5 shrink-0 text-primary" />
        <span className="truncate font-medium text-foreground">
          {voiceNotice || "Listening... speak your inquiry"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          stopHardware();
          onClose();
        }}
        className="flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-card px-2 py-0.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
      >
        <Check className="size-3" />
        <span>Done</span>
      </button>
    </div>
  );
}
