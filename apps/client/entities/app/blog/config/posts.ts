const SLUGS = ['hysteria2-vs-vless', 'vpn-not-working-hotel-wifi', 'vpn-android-tv', 'why-vpn-slows-down', 'subscription-link-explained'] as const;

export type BlogSlug = (typeof SLUGS)[number];

export const BLOG_SLUGS: readonly BlogSlug[] = SLUGS;

export const POST_SECTIONS: Record<BlogSlug, readonly string[]> = {
  'hysteria2-vs-vless': ['whatIsHysteria', 'whatIsReality', 'packetLoss', 'blocking', 'howToChoose'],
  'vpn-not-working-hotel-wifi': ['whyItFails', 'udpBlocked', 'switchToTcp', 'captivePortal', 'stillStuck'],
  'vpn-android-tv': ['whatYouNeed', 'installing', 'addingSubscription', 'remoteControl', 'autoConnect'],
  'why-vpn-slows-down': ['distance', 'protocol', 'packetLoss', 'provider', 'whatToDo'],
  'subscription-link-explained': ['whatItIs', 'whyOneLink', 'howItUpdates', 'security', 'otherApps']
};

export const isBlogSlug = (slug: string): slug is BlogSlug => Object.hasOwn(POST_SECTIONS, slug);
