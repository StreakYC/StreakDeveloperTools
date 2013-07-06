google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(function(){
    drawChart();
});


function drawChart() {
  var uri = window.location.href;
  var encodedData = uri.split('=')[1];
  var dataArray = JSON.parse(decodeURIComponent(encodedData));

  var data = new google.visualization.DataTable();
  var header = dataArray[0];
  for (var i = 0; i < header.length; i++) {
    var type = 'number';
    if (i == 0) {
      type = 'datetime'
    }
    data.addColumn(type, header[i]);
  }

  for (var i = 1; i < dataArray.length; i++) {
    dataArray[i][0] = new Date(dataArray[i][0]);
    data.addRow(dataArray[i]);
  }


  var options = {
    "chartArea.left": "0",
    "chartArea.width": "100%"
  };

  var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
  chart.draw(data, options);
}