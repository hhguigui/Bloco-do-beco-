import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiStream, errorMessage } from "./api";

// Streams a Claude response from /api/ai/* into local state, chunk by chunk.
export function useAiStream<B>(path: string) {
  const [text, setText] = useState("");
  const mutation = useMutation({
    mutationFn: async ({ body, onDelta }: { body: B; onDelta?: (chunk: string) => void }) => {
      setText("");
      let full = "";
      await apiStream(path, body, (chunk) => {
        full += chunk;
        setText((prev) => prev + chunk);
        onDelta?.(chunk);
      });
      return full;
    },
    onError: (err) => toast.error(errorMessage(err, "A IA não respondeu agora. Tente novamente.")),
  });
  return {
    text,
    run: (body: B, onDelta?: (chunk: string) => void) => mutation.mutateAsync({ body, onDelta }).catch(() => ""),
    isPending: mutation.isPending,
  };
}
