export function createContextMenuTemplate(params, copyImage) {
  const template = [];

  if (params.mediaType === "image" && params.hasImageContents) {
    template.push(
      {
        label: "Copy Image",
        click: copyImage
      },
      { type: "separator" }
    );
  }

  template.push(
    { role: "cut", enabled: params.editFlags.canCut },
    { role: "copy", enabled: params.editFlags.canCopy },
    { role: "paste", enabled: params.editFlags.canPaste },
    { role: "selectAll" }
  );

  return template;
}
