// Content type definitions for Biyu Boxing website
// These types define the structure for dynamic content (news, fighters, events)

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: Date;
  updatedAt: Date;
  featuredImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  category: 'announcement' | 'fight-results' | 'training-tips' | 'events' | 'general';
  tags: string[];
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface Fighter {
  id: string;
  name: string;
  slug: string;
  nickname?: string;
  bio: string;
  weightClass: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
    knockouts?: number;
  };
  profileImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  gallery?: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
  }>;
  achievements: string[];
  fightHistory: Array<{
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    method: string;
    date: Date;
    event: string;
  }>;
  stats: {
    age: number;
    height: string;
    reach: string;
    stance: 'orthodox' | 'southpaw' | 'switch';
    proDebut?: Date;
  };
  social?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  eventType: 'fight-night' | 'training-camp' | 'workshop' | 'championship' | 'amateur-bout';
  date: Date;
  endDate?: Date;
  location: {
    venue: string;
    address: string;
    city: string;
    state?: string;
    country: string;
  };
  featuredImage: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  status: 'upcoming' | 'completed' | 'cancelled';
  fights?: Array<{
    mainCard: boolean;
    fighter1: string;
    fighter2: string;
    weightClass: string;
    result?: {
      winner: string;
      method: string;
      round?: number;
      time?: string;
    };
  }>;
  ticketInfo?: {
    available: boolean;
    price?: string;
    url?: string;
  };
  gallery?: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
  }>;
  meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

// Navigation structure matching the original site
export const NAVIGATION_STRUCTURE = {
  primary: [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us/' },
    { label: 'News', href: '/news/' },
    {
      label: 'Events',
      href: '#',
      dropdown: [
        { label: 'Upcoming Events', href: '/upcoming-events/' },
        { label: 'Previous Events', href: '/previous-events/' }
      ]
    },
    { label: 'Fighters', href: '/our-fighters/' },
    { label: 'Box for Us', href: '/box-for-us/' },
    { label: 'Contact Us', href: '/contact-us/' }
  ],
  footer: {
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about-us/' },
      { label: 'Our Fighters', href: '/our-fighters/' },
      { label: 'Box for Us', href: '/box-for-us/' }
    ],
    eventsNews: [
      { label: 'Upcoming Events', href: '/upcoming-events/' },
      { label: 'Previous Events', href: '/previous-events/' },
      { label: 'Latest News', href: '/news/' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy/' },
      { label: 'Terms of Service', href: '/terms-of-service/' }
    ]
  }
} as const;