"use client";

// Adapted from the shadcn/ui toast hook.
import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function dispatch(action: Partial<State> | ((s: State) => State)) {
  memoryState =
    typeof action === "function"
      ? action(memoryState)
      : { ...memoryState, ...action };
  listeners.forEach((l) => l(memoryState));
}

function remove(id: string) {
  dispatch((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();
  const dismiss = () => remove(id);

  dispatch((s) => ({
    toasts: [
      { ...props, id, open: true, onOpenChange: (o: boolean) => !o && dismiss() },
      ...s.toasts,
    ].slice(0, TOAST_LIMIT),
  }));

  timeouts.set(
    id,
    setTimeout(() => remove(id), TOAST_REMOVE_DELAY),
  );

  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (id: string) => remove(id),
  };
}

export { useToast, toast };
