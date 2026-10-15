export function createApplicationMenuTemplate({
  platform = process.platform,
  productName,
  checkForUpdates,
  openReleaseNotes,
  openRepository,
  reportProblem,
  showAbout,
}) {
  const isMac = platform === "darwin";
  const template = [];

  if (isMac) {
    template.push({
      label: productName,
      submenu: [
        { label: `About ${productName}`, click: showAbout },
        { label: "Check for Updates...", click: checkForUpdates },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  template.push(
    {
      label: "File",
      submenu: isMac
        ? [{ role: "close" }]
        : [{ role: "close" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", label: "Reload Messenger" },
        { role: "forceReload", label: "Force Reload Messenger" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        ...(isMac
          ? [
              { role: "zoom" },
              { type: "separator" },
              { role: "front" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        ...(!isMac
          ? [
              { label: "Check for Updates...", click: checkForUpdates },
              { type: "separator" },
            ]
          : []),
        { label: "Release Notes", click: openReleaseNotes },
        { label: "Project on GitHub", click: openRepository },
        { label: "Report a Problem", click: reportProblem },
        ...(!isMac
          ? [
              { type: "separator" },
              { label: `About ${productName}`, click: showAbout },
            ]
          : []),
      ],
    },
  );

  return template;
}
