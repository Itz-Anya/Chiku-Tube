// Curated home-feed catalog. The upstream /YouTube search endpoint is unreliable
// (frequently returns []), so the home page uses this hand-picked list of known
// YouTube IDs and resolves each via the working /Url endpoint. Live videos are
// excluded (duration === 0 from the API).

export interface CatalogItem {
  id: string; // YouTube video id
  channel?: string; // friendly creator name override (API often returns "Unknown Channel")
}

export interface CatalogShelf {
  title: string;
  items: CatalogItem[];
}

export const CATALOG: CatalogShelf[] = [
  {
    title: "Trending Picks",
    items: [
      { id: "dQw4w9WgXcQ", channel: "Rick Astley" },
      { id: "9bZkp7q19f0", channel: "PSY" },
      { id: "kJQP7kiw5Fk", channel: "Luis Fonsi" },
      { id: "JGwWNGJdvx8", channel: "Ed Sheeran" },
      { id: "RgKAFK5djSk", channel: "Wiz Khalifa" },
      { id: "OPf0YbXqDm0", channel: "Mark Ronson" },
      { id: "fJ9rUzIMcZQ", channel: "Queen" },
      { id: "hT_nvWreIhg", channel: "OneRepublic" },
    ],
  },
  {
    title: "Tech & Reviews",
    items: [
      { id: "Wd5R9CMVemY", channel: "Marques Brownlee" },
      { id: "VqgEq6_GFTI", channel: "Marques Brownlee" },
      { id: "TAU0xKjvSLE", channel: "Linus Tech Tips" },
      { id: "p5kcdLOsa8o", channel: "MrWhoseTheBoss" },
      { id: "NUwKYffLY7Y", channel: "Mrwhosetheboss" },
      { id: "gPFgj2nIRFE", channel: "Apple" },
      { id: "JhgK7-bpvX8", channel: "Austin Evans" },
      { id: "fYZebOWZIs0", channel: "Veritasium" },
    ],
  },
  {
    title: "Science & Curiosity",
    items: [
      { id: "yWO-cvGETRQ", channel: "Veritasium" },
      { id: "QfDoQwIAaXg", channel: "Veritasium" },
      { id: "jvGl5O5Y_5w", channel: "Kurzgesagt" },
      { id: "5TbUxGZtwGI", channel: "Kurzgesagt" },
      { id: "_X_AfRk9F9w", channel: "Kurzgesagt" },
      { id: "ulCdoCfw-bY", channel: "Vsauce" },
      { id: "9-Jl0dxWQs8", channel: "Vsauce" },
      { id: "uD4izuDMUQA", channel: "SmarterEveryDay" },
    ],
  },
  {
    title: "Cooking & Food",
    items: [
      { id: "8t_yfaPi1bM", channel: "Babish Culinary Universe" },
      { id: "Aks0pvyQNGM", channel: "Joshua Weissman" },
      { id: "1bQq4OjCnVw", channel: "Bon Appetit" },
      { id: "DkdTm6sQQjk", channel: "Gordon Ramsay" },
      { id: "K4TOrB7at0Y", channel: "Tasty" },
      { id: "L3JX1U5_2_Y", channel: "First We Feast" },
    ],
  },
  {
    title: "Travel & Adventure",
    items: [
      { id: "K3-PwwniLp8", channel: "Drew Binsky" },
      { id: "Sc6SSHuZvQE", channel: "FunForLouis" },
      { id: "ScMzIvxBSi4", channel: "Casey Neistat" },
      { id: "wqIu_OJQwuM", channel: "Lost LeBlanc" },
      { id: "TGXTtfJDvU0", channel: "Mark Wiens" },
      { id: "yyB-TmlkB18", channel: "Mark Wiens" },
    ],
  },
  {
    title: "Documentaries",
    items: [
      { id: "5IsSpAOD6K8", channel: "National Geographic" },
      { id: "6Af6b_wyiwI", channel: "BBC Earth" },
      { id: "Pgom-z2EPbI", channel: "BBC Earth" },
      { id: "TC9zHHZ8KhA", channel: "Vox" },
      { id: "fpbOEoRrHyU", channel: "Vox" },
    ],
  },
  {
    title: "Comedy",
    items: [
      { id: "9bMG7yT6ulY", channel: "Trevor Noah" },
      { id: "frU8oKjC4SU", channel: "Conan O'Brien" },
      { id: "PB-nu0PBRmM", channel: "Jimmy Fallon" },
      { id: "Y7d3W3f6sTo", channel: "Bo Burnham" },
    ],
  },
  {
    title: "Learning",
    items: [
      { id: "HluANRwPyNo", channel: "TED" },
      { id: "iCvmsMzlF7o", channel: "TED-Ed" },
      { id: "Unzc731iCUY", channel: "TED" },
      { id: "WPoQfKQlOjg", channel: "CrashCourse" },
      { id: "8jPQjjsBbIc", channel: "Khan Academy" },
    ],
  },
];

export function getShelfByTitle(title: string): CatalogShelf | undefined {
  return CATALOG.find((s) => s.title === title);
}
