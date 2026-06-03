import eventsConfig from "./events.json";

export type EventStatus = "scheduled" | "completed" | "cancelled" | "postponed";

interface SiteEventConfig {
  name?: string;
  date?: string;
  status?: EventStatus;
  venueName?: string;
  locationAddress?: string;
  info?: string;
  uiDay?: string;
  uiPlace?: string;
  sourceUrl?: string;
  videoPlaylistUrl?: string;
  videoPlaylistName?: string;
  videoPlaylistTitle?: string;
  description?: string;
}

export interface SiteEvent {
  name: string;
  date: string;
  status: EventStatus;
  venueName: string;
  locationAddress: string;
  info: string;
  uiDay: string;
  uiPlace: string;
  sourceUrl?: string;
  videoPlaylistUrl?: string;
  videoPlaylistName?: string;
  videoPlaylistTitle?: string;
  description: string;
}

export const eventStatusMap = {
  scheduled: "https://schema.org/EventScheduled",
  completed: "https://schema.org/EventCompleted",
  cancelled: "https://schema.org/EventCancelled",
  postponed: "https://schema.org/EventPostponed"
} as const;

export const events: SiteEvent[] = (eventsConfig as SiteEventConfig[]).map((item, index) => {
  if (!item.name || !item.date || !item.status || !item.venueName || !item.locationAddress || !item.uiDay || !item.uiPlace) {
    throw new Error(`Invalid event config at index ${index}: missing required fields.`);
  }

  if (Number.isNaN(Date.parse(item.date))) {
    throw new Error(`Invalid event date at index ${index}: "${item.date}"`);
  }

  return {
    name: item.name,
    date: item.date,
    status: item.status,
    venueName: item.venueName,
    locationAddress: item.locationAddress,
    info: item.info || "",
    uiDay: item.uiDay,
    uiPlace: item.uiPlace,
    sourceUrl: item.sourceUrl,
    videoPlaylistUrl: item.videoPlaylistUrl,
    videoPlaylistName: item.videoPlaylistName,
    videoPlaylistTitle: item.videoPlaylistTitle,
    description: item.description || "Concert Nice Boys - Tribute Guns N' Roses"
  };
});

export const eventsByDateDesc = [...events].sort((a, b) => b.date.localeCompare(a.date));
export const videoEvents = eventsByDateDesc.filter((event) => !!event.videoPlaylistUrl && event.videoPlaylistUrl.trim().length > 0);

const today = new Date();
today.setHours(0, 0, 0, 0);

export const upcomingEvent = [...events]
  .filter((event) => event.status === "scheduled" && new Date(event.date) >= today)
  .sort((a, b) => a.date.localeCompare(b.date))[0];

export const pastEvents = eventsByDateDesc.filter((event) => new Date(event.date) < today || event.status !== "scheduled");
export const featuredVideoEvents = videoEvents.slice(0, 3);
export const hasMoreVideoEvents = videoEvents.length >= 3;
