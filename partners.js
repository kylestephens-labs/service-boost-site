// The report remains a quick reference; its link works without JavaScript.
for (const trigger of document.querySelectorAll('[data-open-dialog]')) {
  trigger.addEventListener('click', event => {
    event.preventDefault();
    const dialog = document.getElementById(trigger.dataset.openDialog);
    if (!dialog.open) dialog.showModal();
  });
}
