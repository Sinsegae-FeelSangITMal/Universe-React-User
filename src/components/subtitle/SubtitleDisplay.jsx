export default function SubtitleDisplay({ subtitle, selectedLang }) {
  if (!subtitle || selectedLang === "none") return null;

  let text = "";
  switch (selectedLang) {
    case "ko":
      text = subtitle.original || "";
      break;
    case "en":
      text = subtitle.translations?.en || "";
      break;
    case "fr":
      text = subtitle.translations?.fr || "";
      break;
    default:
      text = subtitle.original || "";
  }

  if (!text) return null;

  return (
    <div className="subtitle-container">
      <div className="subtitle-overlay">
        <span className="subtitle-line">{text}</span>
      </div>
    </div>
  );
}
