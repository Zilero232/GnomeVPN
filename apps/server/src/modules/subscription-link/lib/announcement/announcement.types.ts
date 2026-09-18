export type AnnouncementNode = {
  country: string;
  createdAt: Date;
  lastHealthyAt: Date | null;
};

export type NodeMomentInput = {
  node: AnnouncementNode;
  now: Date;
};

export type AnnouncementInput = {
  currentPeriodEnd: Date | null;
  hasSubscription: boolean;
  nodes: AnnouncementNode[];
  now?: Date;
};
