module.exports = function(number) {
  var padding = '';
  for (var i = 0; i < number; i++) {
    padding += '  ';
  }
  return padding;
};
