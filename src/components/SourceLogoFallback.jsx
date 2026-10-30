import { useState } from "react";
import { getSourceInitials, getSourceLogoUrl } from "../sourceLogos";

export default function SourceLogoFallback({ article }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = getSourceLogoUrl(article);
  const initials = getSourceInitials(article?.source);

  if (!logoUrl || failed) {
    return (
      <div className="story-fallback-art story-fallback-initials" aria-hidden="true">
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <div className="story-fallback-art story-fallback-logo" aria-hidden="true">
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      <span className="story-fallback-source">{article.source}</span>
    </div>
  );
}
