$(document).ready(function() {
  $('#hashButton').click(function() {
    var curr = $('#text').val();
    var hashed = sha256(curr);
    $('#text').val(hashed);
  });
});
