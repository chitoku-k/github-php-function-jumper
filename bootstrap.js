const getFunctionsWithElements = (matches) => {
  const items = [];
  matches.forEach((value, key) => {
    const name = value.innerText
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/^([^(]+).*$/, '$1')
      .replace(/^\\/, '');
    const char = name.charAt(0).toLowerCase();
    const loweredName = name.toLowerCase();
    if (functions.hasOwnProperty(char) && functions[char].hasOwnProperty(loweredName)) {
      items.push({
        name,
        element: value,
        details: functions[char][loweredName],
      });
    }
  });
  return items;
};

const inspectPage = () => {
  const filteredItems = [
    // Source tree
    ...getFunctionsWithElements(
      document.querySelectorAll(
        '.type-php .pl-c1:not([data-gp-is-rendered="true"])'
      )
    ),

    // Files
    ...getFunctionsWithElements(
      document.querySelectorAll(
        '[data-file-type=".php"] .pl-c1:not([data-gp-is-rendered="true"])'
      )
    ),

    // Discussion area
    ...getFunctionsWithElements(
      document.querySelectorAll(
        '#discussion_bucket code:not([data-gp-is-rendered="true"])'
      )
    ),
  ];

  const loadedStyle = document.querySelector('#gp-code-jumper-style');
  if (loadedStyle) {
    // Remove loaded style.
    loadedStyle.remove();
  }

  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.setAttribute('id', 'gp-code-jumper-style');

  style.innerHTML =
      '.gp-code-jumper-targeted { position: relative; display: inline-block }'
    + '.gp-code-jumper-targeted__popup { position: absolute; left: calc(-50% - 40px); box-shadow: 0 0 3px #888888; color: #000000; border: 1px solid #888888; background-color: #FFFFFF; display: none; z-index: 1; padding: 10px; border-radius: 2px; }'
    + '.gp-code-jumper-targeted__popup--top { top: -45px; }'
    + '.gp-code-jumper-targeted__popup--bottom { bottom: -45px }'
    + '.gp-code-jumper-targeted:hover .gp-code-jumper-targeted__popup { display: block }'
    + '.gp-code-jumper-colors--primary { color: #F92772 }'
    + '.gp-code-jumper-fonts--bold { font-weight: bold }'
  ;

  // Inject to body section.
  document.querySelector('body').append(style);

  chrome.storage.sync.get(
    null,
    (items) => {
      const pageURI = manual[items.languageId || 0];
      filteredItems.map((value) => {
        const parameters = value.details.spec.parameters
          .replace(
            /(?<!\$)(string|array|int|integer|bool|boolean|void|float|double|callable|resource|mixed)/g,
            '<span class="gp-code-jumper-colors--primary">$1</span>'
          );

        // add rendered flag
        value.element.setAttribute('data-gp-is-rendered', 'true');

        const position = items.positionId || 0;

        value.element.innerHTML =
            `<a href="${pageURI + value.details.url}.php" target="_blank" class="gp-code-jumper-targeted">`
          + `${value.element.innerHTML}`
          + '<div class="gp-code-jumper-targeted__popup gp-code-jumper-targeted__popup--' + (position === 0 ? 'top' : 'bottom') + '">'
          + `<span class="gp-code-jumper-colors--primary">function</span> `
          + `<span class="gp-code-jumper-fonts--bold">${value.details.name}</span>`
          + `(${parameters})`
          + `<span class="gp-code-jumper-colors--primary">: ${value.details.spec.returnValue}</span>`
          + '</div>'
          + `</a>`;
      });
      return true;
    }
  );
};

setInterval(
  () => {
    // re-render
    inspectPage();
  },
  3000
);

inspectPage();
