import { readBlockConfig, toCamelCase } from '../../scripts/lib-franklin.js';

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.type === 'file') {
      payload[fe.id] = fe.dataset?.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

async function submitForm(form) {
  const payload = constructPayload(form);
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  return payload;
}

let loadCaptchaScripts = function() {
    import('./captcha.js').then((response) => {
        const { onCaptchaScriptLoad, onCaptchaResponse } =  response ;
        window.onCaptchaScriptLoad = onCaptchaScriptLoad;
        window.onCaptchaResponse = onCaptchaResponse;

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?onload=onCaptchaScriptLoad&render=explicit`;
        script.setAttribute('async', '');    
        script.setAttribute('defer', '');  

        document.head.append(script);
    });

    loadCaptchaScripts = function(){};
}

function createCaptcha() {
    loadCaptchaScripts();
    const div = document.createElement('div');
    div.classList.add('g-recaptcha');
    return div;
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') !== 'true') {
    form.setAttribute('data-submitting', 'true');
    await submitForm(form);
    // window.location.href = redirectTo || 'thankyou';
  }
}

function createLabel(fd, tagName = 'label') {
  const label = document.createElement(tagName);
  label.setAttribute('for', fd.Id);
  label.className = 'field-label';
  label.textContent = fd.Label || '';
  if (fd.Tooltip) {
    label.title = fd.Tooltip;
  }
  return label;
}

function createFieldWrapper(fd, tagName = 'div') {
  const fieldWrapper = document.createElement(tagName);
  const nameStyle = fd.Name ? ` form-${fd.Name}` : '';
  const fieldId = `form-${fd.Type}-wrapper${nameStyle}`;
  fieldWrapper.className = fieldId;
  fieldWrapper.dataset.fieldset = fd.Fieldset ? fd.Fieldset : '';
  fieldWrapper.classList.add('field-wrapper');
  fieldWrapper.append(createLabel(fd));
  return fieldWrapper;
}

function createButton(fd) {
  const wrapper = createFieldWrapper(fd);
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.type = fd.Type;
  button.classList.add('button');
  button.dataset.redirect = fd.Extra || '';
  button.id = fd.Id;
  button.name = fd.Name;
  wrapper.replaceChildren(button);
  return wrapper;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  return input;
}

const getId = (function getId() {
  const ids = {};
  return (name) => {
    ids[name] = ids[name] || 0;
    const idSuffix = ids[name] ? `-${ids[name]}` : '';
    ids[name] += 1;
    return `${name}${idSuffix}`;
  };
}());

const fieldRenderers = {
  submit: createButton,
  captcha: createCaptcha
};

function renderField(fd) {
  const renderer = fieldRenderers[fd.Type];
  let field;
  if (typeof renderer === 'function') {
    field = renderer(fd);
  } else {
    field = createFieldWrapper(fd);
    field.append(createInput(fd));
  }
  return field;
}

async function fetchData(url) {
  const resp = await fetch(url);
  const json = await resp.json();
  return json.data.map((fd) => ({
    ...fd,
    Id: fd.Id || getId(fd.Name),
    Value: fd.Value || '',
  }));
}

async function fetchForm(pathname) {
  // get the main form
  const jsonData = await fetchData(pathname);
  return jsonData;
}

async function createForm(formURL) {
  const { pathname } = new URL(formURL);
  const data = await fetchForm(pathname);
  const form = document.createElement('form');
  data.forEach((fd) => {
    const el = renderField(fd);
    const input = el.querySelector('input,textarea,select');
    if (input) {
      input.id = fd.Id;
      input.name = fd.Name;
      input.value = fd.Value;
    }
    form.append(el);
  });

  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.submitter.setAttribute('disabled', '');
    handleSubmit(form, e.submitter.dataset?.redirect);
  });
  
  return form;
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const formLink = block.querySelector('a[href$=".json"]');
  if (formLink) {
    const form = await createForm(formLink.href);
    formLink.replaceWith(form);

    // store configuration in form
    Object.keys(config).forEach((key) => {
      form.dataset[toCamelCase(key)] = config[key];
    });

    // delete configuration nodes
    while (block.childElementCount > 1) {
      block.removeChild(block.lastElementChild);
    }
  }
}