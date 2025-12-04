import React from 'react';

const ShareButtons = ({ url, title }) => {
  const shareUrl = encodeURIComponent(url || window.location.href);
  const text = encodeURIComponent(title || 'Check this BudgetBuddy report');
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={() => navigator.clipboard.writeText(url || window.location.href)}>Copy Link</button>
      <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`} target="_blank" rel="noreferrer">X</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer">LinkedIn</a>
      <a href={`https://api.whatsapp.com/send?text=${text}%20${shareUrl}`} target="_blank" rel="noreferrer">WhatsApp</a>
    </div>
  );
};

export default ShareButtons;
