import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface PopupData {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

function getStorageKey(popupId: string, period: string) {
  return `popup_dismiss_${popupId}_${period}`;
}

function isDismissed(popupId: string): boolean {
  // Check 1-day dismiss
  const dayKey = getStorageKey(popupId, "day");
  const dayVal = localStorage.getItem(dayKey);
  if (dayVal && new Date(dayVal) > new Date()) return true;

  // Check 1-week dismiss
  const weekKey = getStorageKey(popupId, "week");
  const weekVal = localStorage.getItem(weekKey);
  if (weekVal && new Date(weekVal) > new Date()) return true;

  return false;
}

export default function PopupDisplay() {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("popups")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      const active = (data as PopupData[]).filter((p) => {
        if (p.start_date && new Date(p.start_date) > new Date()) return false;
        if (p.end_date && new Date(p.end_date) < new Date()) return false;
        if (isDismissed(p.id)) return false;
        return true;
      });
      setPopups(active);
      setVisibleIds(new Set(active.map((p) => p.id)));
    }
  };

  const dismissPopup = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const dismissForDay = (id: string) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 1);
    expiry.setHours(0, 0, 0, 0);
    localStorage.setItem(getStorageKey(id, "day"), expiry.toISOString());
    dismissPopup(id);
  };

  const dismissForWeek = (id: string) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    localStorage.setItem(getStorageKey(id, "week"), expiry.toISOString());
    dismissPopup(id);
  };

  const activePopups = popups.filter((p) => visibleIds.has(p.id));

  if (activePopups.length === 0) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => activePopups.forEach((p) => dismissPopup(p.id))} />

      {activePopups.map((popup, index) => {
        const isMobile = window.innerWidth < 640;
        const popupWidth = isMobile ? Math.min(popup.width, window.innerWidth - 32) : popup.width;
        const popupHeight = isMobile ? "auto" : popup.height;

        return (
          <div
            key={popup.id}
            className="fixed z-[9999] shadow-2xl rounded-lg overflow-hidden bg-background border"
            style={
              isMobile
                ? {
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: popupWidth,
                    maxHeight: "80vh",
                  }
                : {
                    left: popup.position_x + index * 30,
                    top: popup.position_y + index * 30,
                    width: popupWidth,
                    height: popupHeight,
                  }
            }
          >
            {/* Close button */}
            <button
              onClick={() => dismissPopup(popup.id)}
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background rounded-full p-1 shadow"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="w-full h-[calc(100%-40px)] overflow-hidden" style={isMobile ? { maxHeight: "calc(80vh - 40px)" } : {}}>
              {popup.image_url ? (
                popup.link_url ? (
                  <a href={popup.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img src={popup.image_url} alt={popup.title} className="w-full h-full object-contain" />
                  </a>
                ) : (
                  <img src={popup.image_url} alt={popup.title} className="w-full h-full object-contain" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center p-6 text-center">
                  <p className="text-lg font-medium">{popup.title}</p>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="h-[40px] bg-muted/90 border-t flex items-center justify-between px-3 text-xs">
              <button
                onClick={() => dismissForDay(popup.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                오늘 하루 보지 않기
              </button>
              <button
                onClick={() => dismissForWeek(popup.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                1주일간 보지 않기
              </button>
              <button
                onClick={() => dismissPopup(popup.id)}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
