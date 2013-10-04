google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(function(){
    drawChart();
});


function drawChart() {
    var uri = window.location.href;
    var encodedData = getURLParameter('data');
    var chartType = getURLParameter('chartType');
    var dataArray = JSON.parse(decodeURIComponent(encodedData));

    var data = getChartDataTable(dataArray, chartType);

    var options = {
        "chartArea.left": "0",
        "chartArea.width": "100%"
    };
    var chart = getChart(chartType);

    chart.draw(data, options);
}

function getChartDataTable(dataArray, chartType) {
    if (chartType == 'timeseries') {
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
        return data;
    }
    else if (chartType == 'columnXY') {
        return google.visualization.arrayToDataTable(transpose(dataArray));
    }
}

function transpose(arr) {
    var retVal = new Array(arr[0].length);
    for (var i = 0; i < retVal.length; i++) {
        retVal[i] = new Array(arr.length);
    }

    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j <arr[i].length; j++) {
            retVal[j][i] = arr[i][j];
        }
    }
    return retVal;
}

function getChart(chartType) {
    if (chartType == 'timeseries') {
        return new google.visualization.LineChart(document.getElementById('chart_div'));
    }
    else {
        return new google.visualization.ColumnChart(document.getElementById('chart_div'));
    }
}

function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
}