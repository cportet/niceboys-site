// Données structurées (JSON-LD schema.org) du site, construites à partir des données réelles
// (events.json, contact.json). Utilisées via le composant <JsonLd data={...} />.
import contactConfig from "./contact.json";
import { eventStatusMap, eventsByDateDesc, type SiteEvent } from "./events";

// Point unique à changer le jour où le groupe aura son propre nom de domaine
export const SITE_URL = "https://niceboys.pages.dev";
const SHARE_IMAGE_URL = `${SITE_URL}/og-image.jpg`;

export type JsonLdObject = Record<string, unknown>;

const bookingMailto = `mailto:${contactConfig.bookingEmail}?subject=${encodeURIComponent(contactConfig.bookingSubject)}`;

const members = [
  { name: "Cédric", jobTitle: "Chanteur principal", sameAs: "https://www.facebook.com/profile.php?id=100046665590020" },
  { name: "Alexis", jobTitle: "Guitariste principal", sameAs: "https://www.instagram.com/alex.mrta" },
  { name: "Trystan", jobTitle: "Guitariste rythmique", sameAs: "https://www.instagram.com/trystan_portet" },
  { name: "Laurent", jobTitle: "Bassiste", sameAs: "https://www.facebook.com/laurent.achard" },
  { name: "Jimmy", jobTitle: "Batteur", sameAs: "https://www.facebook.com/jimmy.cerullo" }
];

const eventDescription = (event: SiteEvent) => (event.info ? `${event.description} — ${event.info}` : event.description);

/** Concert résumé, imbriqué dans le MusicGroup. */
function nestedEvent(event: SiteEvent): JsonLdObject {
  return {
    "@type": "MusicEvent",
    name: event.name,
    startDate: event.date,
    eventStatus: eventStatusMap[event.status],
    performer: {
      "@type": "MusicGroup",
      name: "Nice Boys"
    },
    location: {
      "@type": "Place",
      name: event.venueName,
      address: event.locationAddress
    },
    description: eventDescription(event),
    url: event.sourceUrl || event.videoPlaylistUrl || SITE_URL
  };
}

/** Le groupe, avec ses membres, réseaux et concerts. */
export function buildMusicGroupSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Nice Boys",
    genre: "Hard Rock",
    alternateName: "Nice Boys – Tribute Band Guns N' Roses",
    description:
      "Tribute band fidèle aux Guns N' Roses, basé dans l'Ain (Auvergne-Rhône-Alpes). Reprises live explosives avec Cédric au chant, Alexis & Trystan aux guitares, Laurent à la basse et Jimmy à la batterie. Disponibles pour jouer partout en Auvergne, Rhône, Alpes, région lyonnaise, ville de lyon et chez vous",
    url: SITE_URL,
    image: `${SITE_URL}/images/group/group.jpg`,
    keywords:
      "tribute Guns N' Roses, GnR tribute, Guns N' Roses live, Guns N' Roses cover band, tribute band, groupe rock, Auvergne-Rhône-Alpes, concert rock, Guns N' Roses, live, France, Ain, Lyon, Rhône, welcome to the jungle",
    areaServed: {
      "@type": "Place",
      name: "Auvergne-Rhône-Alpes, France"
    },
    makesOffer: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: bookingMailto
    },
    foundingLocation: {
      "@type": "Place",
      name: "Ain, Auvergne-Rhône-Alpes, France"
    },
    musicGroupMember: members.map((member) => ({ "@type": "Person", ...member })),
    sameAs: ["https://www.facebook.com/profile.php?id=100046665590020", "https://www.instagram.com/_the_nice_boys_"],
    event: eventsByDateDesc.map(nestedEvent),
    location: {
      "@type": "Place",
      name: "Ain",
      address: {
        "@type": "PostalAddress",
        addressRegion: "Auvergne-Rhône-Alpes",
        addressCountry: "FR"
      }
    }
  };
}

/** Un concert en MusicEvent autonome (format attendu par les résultats enrichis "Événements" de Google). */
export function buildMusicEventSchema(event: SiteEvent): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `Nice Boys – Tribute Guns N' Roses @ ${event.venueName}`,
    startDate: event.date,
    eventStatus: eventStatusMap[event.status],
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: eventDescription(event),
    image: [SHARE_IMAGE_URL],
    url: event.sourceUrl || `${SITE_URL}/`,
    location: {
      "@type": "Place",
      name: event.venueName,
      address: event.locationAddress
    },
    performer: {
      "@type": "MusicGroup",
      name: "Nice Boys",
      url: `${SITE_URL}/`
    },
    organizer: {
      "@type": "Organization",
      name: event.venueName
    }
  };
}
