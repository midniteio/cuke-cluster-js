module.exports = function(text, color) {
  var colors = {
    gray: '\x1B[2m\x1B[37m',
    red: '\x1B[31m',
    green: '\x1B[32m',
    yellow: '\x1B[33m',
    cyan: '\x1B[36m'
  };
  return colors[color] + text + '\x1B[0m';
};
