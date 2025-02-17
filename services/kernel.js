const getSPLWithElements = (matches, marker) => {
  const items = [];
  matches.forEach((value, key) => {
    const name = value.innerText
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .replace(/^([^(]+).*$/, '$1')
      .replace(/^\\/, '');
    const char = name.charAt(0).toLowerCase();
    const loweredName = name.toLowerCase();

    // Set rendering flags.
    value.setAttribute('data-gp-is-rendered', 'true');

    if (classes.hasOwnProperty(char) && classes[char].hasOwnProperty(loweredName) && classes[char][loweredName]['methods'].hasOwnProperty('__construct')) {
      classServiceRegistry(items, marker, name, value, classes[char][loweredName]);
      return;
    }

    if (!functions.hasOwnProperty(char) || !functions[char].hasOwnProperty(loweredName)) {
      return;
    }
    functionServiceRegistry(items, marker, name, value, functions[char][loweredName]);
  });
  return items;
};

const getVariableWithElements = (matches, marker) => {
  const items = [];
  matches.forEach((value, key) => {

    // Set rendering flags.
    value.setAttribute('data-gp-is-rendered', 'true');

    const variableName = value.innerText;
    const nextNode = value.nextSibling;
    if (nextNode
      && nextNode.nodeName === 'SPAN'
      && nextNode.innerText === '->'
    ) {
      const nextNextNode = nextNode.nextSibling;
      if (nextNextNode) {
        let calleeMethodName = null;
        calleeMethodName = nextNextNode.innerText || nextNextNode.nodeValue
          .replace(/^\s*([A-Za-z0-9_]+).+/, '$1');

        if (!variables.hasOwnProperty(variableName)) {
          return;
        }

        const lineNumber = value.parentNode.parentNode.getAttribute('id').replace(/^LC/, '') * 1;

        let beforeDiff = null;
        let targetedLineNumber = null;

        for (const definedMethodLineNumber of Object.keys(variables[variableName].methodPaths).map((v) => v * 1)) {
          const diff = Math.abs(definedMethodLineNumber - lineNumber);

          if (definedMethodLineNumber > lineNumber) {
            continue;
          }

          if (beforeDiff === null || diff < beforeDiff) {
            beforeDiff = diff;
            targetedLineNumber = definedMethodLineNumber;
          }
        }

        if (targetedLineNumber === null) {
          return;
        }

        const char = calleeMethodName.charAt(0).toLowerCase();
        const loweredName = calleeMethodName.toLowerCase();
        const classDetails = variables[variableName].methodPaths[targetedLineNumber];

        if (!classDetails.methods.hasOwnProperty(loweredName)) {
          return;
        }

        items.push({
          marker,
          calleeMethodName,
          element: nextNextNode,
          ...templates.optionParameters,
          isClass: true,
          isDynamicMethodAtClass: true,
          enableToWrapNode: nextNextNode.nodeName === '#text',
          details: classDetails.methods[loweredName],
          classDetails,
        });
      }
    }
  });
  return items;
};

const getCommentOutsWithElements = (matches, marker) => {
  const allowsAnnotations = [
    '@return',
    '@var',
    '@param',
  ];
  const items = [];
  matches.forEach((value, key) => {
    const annotation = value.innerText;
    value.setAttribute('data-gp-is-rendered', 'true');
    if (allowsAnnotations.indexOf(annotation.toLowerCase()) === -1) {
      return;
    }

    const nextNode = value.nextSibling;
    if (nextNode.nodeName !== '#text') {
      return;
    }

    const info = nextNode.nodeValue
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')
      .split(/\s+/);

    if (typeof info[0] === 'undefined') {
      return;
    }

    for (const name of info[0].split('|')) {
      const loweredName = name.toLowerCase();
      const char = name.charAt(0).toLowerCase();
      if (!classes.hasOwnProperty(char)
        || !classes[char].hasOwnProperty(loweredName)
        || !classes[char][loweredName]['methods'].hasOwnProperty('__construct')
      ) {
        continue;
      }
      const classDetails = classes[char][loweredName];

      items.push({
        marker,
        name,
        element: nextNode,
        ...templates.optionParameters,
        isClass: true,
        isClassReference: true,
        enableToWrapNode: true,
        details: classDetails.methods.__construct,
        classDetails,
      });
    }

  });
  return items;
};

const getDynamicMethodConstructionNode = (matches, marker) => {
  const items = {};
  const methodPaths = {};

  matches.forEach((value, key) => {

    const name = value.innerText;
    let nextNode = value.nextSibling;
    const nodes = [];
    const targetedVariables = [name];

    // Reading
    let i = 0;
    do {
      // Collecting
      if (nextNode !== null
        && nextNode.nodeName === 'SPAN'
      ) {
        nodes.push(nextNode.innerText);
      }
    } while (nextNode !== null && (nextNode = nextNode.nextSibling) !== null);

    // Check patterns
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (node === '=') {
        node = nodes[++i];
        if (!node) {
          break;
        }

        // Find the variable
        if (node.charAt(0) === '$') {
          targetedVariables.push(node);
          continue;
        }

        // Found a construction
        if (node.toLowerCase() === 'new') {
          node = nodes[++i];
          if (!node) {
            break;
          }
          const char = node.charAt(0).toLowerCase();
          const loweredClassName = node.toLocaleLowerCase();

          // Find class
          if (!classes.hasOwnProperty(char)
            || !classes[char].hasOwnProperty(loweredClassName)
          ) {
            break;
          }

          // Find line number
          const lineNumber = value.parentNode.parentNode.getAttribute('id').replace(/^LC/, '') * 1;
          methodPaths[lineNumber] = classes[char][loweredClassName];
          break;
        }
      }
    }

    if (Object.keys(methodPaths).length === 0) {
      return [];
    }

    for (const variableName of targetedVariables) {
      items[variableName] = {
        methodPaths,
      };
    }
  });
  return items;
};
