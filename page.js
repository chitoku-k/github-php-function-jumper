function update(propertyName) {
  chrome.storage.sync.get(
    ['languageId', 'positionId'],
    (items) => {
      const value = items[propertyName] || 0;

      const propertyTarget = propertyName === 'languageId'
        ? ['language', 'data-language-id']
        : ['position', 'data-position-id'];

      document.querySelector(`.choose-${propertyTarget[0]} .active`).classList.remove('active');
      document.querySelector(`.choose-${propertyTarget[0]} [${propertyTarget[1]}="${value}"]`).classList.add('active');
    }
  );
}
function change(propertyName, value) {
  chrome.storage.sync.set({
    [propertyName]: value,
  });
  update(propertyName);

  document.querySelector('.description').classList.add('disabled');
  document.querySelector('.flash-message').classList.remove('disabled');
}

document.addEventListener('DOMContentLoaded', () => {
  update('languageId');
  update('positionId');

  // Update languages
  document.querySelectorAll('[data-language-id]').forEach((element) => {
    element.addEventListener('click', (e) => {
      const languageId = e.path[1].getAttribute('data-language-id') * 1;
      change(
        'languageId', languageId
      );
    })
  });

  // Update positions
  document.querySelectorAll('[data-position-id]').forEach((element) => {
    element.addEventListener('click', (e) => {
      const positionId = e.path[1].getAttribute('data-position-id') * 1;
      change(
        'positionId', positionId
      );
    })
  });
});
