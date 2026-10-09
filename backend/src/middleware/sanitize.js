// Strips keys beginning with "$" or containing "." from user input (NoSQL operator injection).
function clean(value) {
  if (Array.isArray(value)) return value.forEach(clean);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else clean(value[key]);
    }
  }
}

module.exports = (req, _res, next) => {
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};
