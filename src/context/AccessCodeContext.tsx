import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { setAccessCode } from "../lib/accessCode";
import { refreshSupabaseClient } from "../lib/supabaseClient";
import { AccessCodePrompt } from "../components/AccessCodePrompt";

interface AccessCodeContextValue {
  /** Opens the access-code modal and resolves once a code has been entered
   * and the Supabase client rebuilt with it. Rejects if the user cancels. */
  requestAccessCode: () => Promise<void>;
}

const AccessCodeContext = createContext<AccessCodeContextValue | null>(null);

export function AccessCodeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<(() => void) | null>(null);
  const rejecterRef = useRef<((err: Error) => void) | null>(null);

  function requestAccessCode(): Promise<void> {
    setOpen(true);
    return new Promise((resolve, reject) => {
      resolverRef.current = resolve;
      rejecterRef.current = reject;
    });
  }

  function handleSubmit(code: string) {
    setAccessCode(code);
    refreshSupabaseClient();
    setOpen(false);
    resolverRef.current?.();
  }

  function handleCancel() {
    setOpen(false);
    rejecterRef.current?.(new Error("Access code entry cancelled"));
  }

  return (
    <AccessCodeContext.Provider value={{ requestAccessCode }}>
      {children}
      {open && <AccessCodePrompt onSubmit={handleSubmit} onCancel={handleCancel} />}
    </AccessCodeContext.Provider>
  );
}

export function useAccessCode(): AccessCodeContextValue {
  const ctx = useContext(AccessCodeContext);
  if (!ctx) {
    throw new Error("useAccessCode must be used within an AccessCodeProvider");
  }
  return ctx;
}
