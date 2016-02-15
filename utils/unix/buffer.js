module.exports = {
  data: '',
  log: function(text) {
    this.data += text + '\n';
  },
  dump: function() {
    var bufferedData = this.data;
    this.data = '';
    return bufferedData;
  }
};
