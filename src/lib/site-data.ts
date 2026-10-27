import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type GalleryItem = Database["public"]["Tables"]["gallery"]["Row"];
export type Settings = Database["public"]["Tables"]["studio_settings"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .eq("authorized", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// ---- tiny store so service cards / gallery can preselect the booking flow ----
type Intent = { serviceId?: string; reference?: { url: string; caption?: string | null }; nonce: number };
let intent: Intent = { nonce: 0 };
const listeners = new Set<() => void>();
export const bookingIntent = {
  get: () => intent,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set(next: Omit<Intent, "nonce">) {
    intent = { ...next, nonce: intent.nonce + 1 };
    listeners.forEach((l) => l());
    document.getElementById("agendamento")?.scrollIntoView({ behavior: "smooth" });
  },
};
export function useBookingIntent() {
  return useSyncExternalStore(bookingIntent.subscribe, bookingIntent.get, bookingIntent.get);
}

export function getAnonSessionId(): string {
  const key = "mf_anon_session";
  try {
    let v = sessionStorage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      sessionStorage.setItem(key, v);
    }
    return v;
  } catch {
    return crypto.randomUUID();
  }
}
