export interface Resource {
  title: string;
  link: string;
  type: "video" | "article" | "course" | "book" | "other";
}

function buildFallbackUrl(
  type: Resource["type"],
  resourceTitle: string,
  milestoneTitle: string,
  goal: string
): string {
  const cleanTitle = resourceTitle
    .replace(/^(video|article|course|book|tutorial|link|guide)\s*[:-]\s*/i, "")
    .trim();
  const searchTerms = `${cleanTitle} ${milestoneTitle} ${goal}`
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const encodedQuery = encodeURIComponent(searchTerms);

  switch (type) {
    case "video":
      return `https://www.youtube.com/results?search_query=${encodedQuery}+tutorial`;
    case "course":
      return `https://www.coursera.org/search?query=${encodedQuery}`;
    case "book":
      return `https://openlibrary.org/search?q=${encodedQuery}`;
    case "article":
    case "other":
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${cleanTitle} tutorial ${goal}`)}`;
  }
}

export async function sanitizeResource(
  resource: Resource,
  milestoneTitle: string,
  goal: string
): Promise<Resource> {
  const cleanTitle = resource.title?.trim() || `${milestoneTitle} Resource`;
  const type = (["video", "article", "course", "book", "other"].includes(resource.type)
    ? resource.type
    : "article") as Resource["type"];

  let rawLink = (resource.link || "").trim();

  // If link is missing or not an http/https URL
  if (!rawLink || (!rawLink.startsWith("http://") && !rawLink.startsWith("https://"))) {
    return {
      title: cleanTitle,
      link: buildFallbackUrl(type, cleanTitle, milestoneTitle, goal),
      type,
    };
  }

  try {
    const parsed = new URL(rawLink);

    // If it's a YouTube watch link, LLMs almost always hallucinate random 11-char video IDs.
    // Replace with a guaranteed YouTube search query link.
    if (
      (parsed.hostname.includes("youtube.com") && parsed.pathname.includes("/watch")) ||
      parsed.hostname === "youtu.be"
    ) {
      const searchTerms = `${cleanTitle} ${milestoneTitle}`
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[^\w\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        title: cleanTitle,
        link: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${searchTerms} tutorial`)}`,
        type: "video",
      };
    }

    // If it's already a clean search URL or root doc page
    if (
      parsed.pathname === "/" ||
      parsed.pathname === "" ||
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("google.com") ||
      parsed.hostname.includes("coursera.org/search") ||
      parsed.hostname.includes("edx.org/search")
    ) {
      return { title: cleanTitle, link: rawLink, type };
    }

    // Fast probe for specific deep links to detect 404s
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    let isDead = false;
    try {
      const probe = await fetch(rawLink, {
        method: "HEAD",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });

      if (probe.status === 404 || probe.status === 410) {
        isDead = true;
      }
    } catch {
      // If HEAD was rejected or failed, attempt a fast GET check
      try {
        const getProbe = await fetch(rawLink, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          signal: controller.signal,
        });

        if (getProbe.status === 404 || getProbe.status === 410) {
          isDead = true;
        }
      } catch {
        // Network timeout / DNS failure
        isDead = true;
      }
    } finally {
      clearTimeout(timeout);
    }

    if (isDead) {
      return {
        title: cleanTitle,
        link: buildFallbackUrl(type, cleanTitle, milestoneTitle, goal),
        type,
      };
    }

    return { title: cleanTitle, link: rawLink, type };
  } catch {
    return {
      title: cleanTitle,
      link: buildFallbackUrl(type, cleanTitle, milestoneTitle, goal),
      type,
    };
  }
}

export async function sanitizeMilestoneResources(
  milestones: Array<{
    title: string;
    description: string;
    microFirstStep: string;
    whyNow: string;
    suggestedTimeBox: string;
    resources: Resource[];
  }>,
  goal: string
) {
  return Promise.all(
    milestones.map(async (milestone) => {
      const sanitizedResources = await Promise.all(
        (milestone.resources || []).map((r) =>
          sanitizeResource(r, milestone.title, goal)
        )
      );

      // Deduplicate resources by link
      const seenLinks = new Set<string>();
      const dedupedResources: Resource[] = [];
      for (const r of sanitizedResources) {
        if (!seenLinks.has(r.link)) {
          seenLinks.add(r.link);
          dedupedResources.push(r);
        }
      }

      return {
        ...milestone,
        resources: dedupedResources,
      };
    })
  );
}
