// src/components/subtitle/SubtitleDisplay.jsx
const SubtitleDisplay = ({ subtitle }) => {
  if (!subtitle) return null;

  return (
    <div className="subtitle-container">
      <div className="subtitle-overlay">
        <div className="subtitle-line subtitle-ko">{subtitle.original}</div>
        <div className="subtitle-line subtitle-en">{subtitle.translations?.en}</div>
        <div className="subtitle-line subtitle-fr">{subtitle.translations?.fr}</div>
      </div>
    </div>
  );
};

export default SubtitleDisplay;
