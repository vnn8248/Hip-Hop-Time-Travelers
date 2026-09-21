import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Hip Hop Time Travelers",
  EMAIL: "hiphoptimetravelers@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Deep dives into hip-hop albums - who built them, what they sampled, and how they hold up in the data.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Deep dives into hip-hop albums, one release at a time.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I have done.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "A collection of my projects, with links to repositories and demos.",
};

// Twitter/X to be added once we have the account handle.
export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/vnn8248/Hip-Hop-Time-Travelers",
  },
];
