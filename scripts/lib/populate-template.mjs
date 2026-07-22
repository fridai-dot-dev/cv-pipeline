import Handlebars from 'handlebars';

export function populateTemplate(templateHtml, data) {
  const compiled = Handlebars.compile(templateHtml);
  return compiled(data);
}
