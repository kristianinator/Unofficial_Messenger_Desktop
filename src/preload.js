const { ipcRenderer } = require('electron');

function countByAriaLabels() {
  // Texts that indicate an unread thread (extend if needed)
  const unreadTexts = [
    'Unread message:',
    'Непрочетено съобщение:',
    'Message non lu :',
    'Mensaje no leído:'
  ];

  let hits = 0;

  for (const text of unreadTexts) {
    const result = document.evaluate(
      `//div[normalize-space(text())='${text}']`,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    hits += result.snapshotLength;
  }

  return hits;
}


function countUnreadBestEffort() {
  const ariaCount = countByAriaLabels();
  if (ariaCount > 0) return ariaCount;

  // 3) If nothing found, assume 0
  return 0;
}

let lastSent = null;

function sendUnreadCount() {
  try {
    const count = countUnreadBestEffort();
    if (count !== lastSent) {
      lastSent = count;
      ipcRenderer.send('unread-count', String(count));
    }
  } catch {
    // ignore
  }
}

// Run early + retries (Messenger loads progressively)
sendUnreadCount();
setInterval(sendUnreadCount, 2500);

// React-style UI changes: observe DOM mutations
const observer = new MutationObserver(() => {
  // debounce-ish
  sendUnreadCount();
});

window.addEventListener('DOMContentLoaded', () => {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  // extra retries after initial load
  setTimeout(sendUnreadCount, 1000);
  setTimeout(sendUnreadCount, 3000);
  setTimeout(sendUnreadCount, 6000);
});
