type ScrollToHashTargetOptions = {
  behavior?: ScrollBehavior;
  updateHistory?: boolean;
};

export function scrollToHashTarget(
  hash: string,
  options?: ScrollToHashTargetOptions,
): boolean {
  const rawId = hash.startsWith("#") ? hash.slice(1) : hash;
  const id = decodeURIComponent(rawId);
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  target.scrollIntoView({
    behavior: options?.behavior ?? "smooth",
    block: "start",
  });

  if (
    options?.updateHistory !== false &&
    typeof window !== "undefined" &&
    window.location.hash !== hash
  ) {
    window.history.pushState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${hash}`,
    );
  }

  return true;
}
