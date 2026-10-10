/** A link in the header or footer navigation. */
export type NavItem = {
  label: string;
  to: string;
};

/** Header links for visitors. Role-based links are added in a later chunk. */
export const visitorNavItems: NavItem[] = [
  { label: "Browse", to: "/browse" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "For businesses", to: "/#for-businesses" },
];

export const footerNavItems: NavItem[] = [
  { label: "Browse listings", to: "/browse" },
  { label: "How it works", to: "/#how-it-works" },
  { label: "List your surplus", to: "/register" },
  { label: "Log in", to: "/login" },
];
