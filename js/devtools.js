var timeseriesGraphButton = null;
var columnXYGraphButton = null;
var showGraphsDiv = null;
var hideGraphButton = null;
var hasResized = false;

$(document).ready(function() {
	createGraphButtons();

	var t = setInterval(function() {
		// check if results exist
		if ($('#body') && $('#main') && !hasResized) {
			hasResized = true;
			$('#body').height(15000);
			$("#main").attr("style", "overflow:auto");
			var evt = document.createEvent('UIEvents');
			evt.initUIEvent('resize', true, false,window,0);
			window.dispatchEvent(evt);

		}

		// add show graph button
		addGraphButtonsToPage();

		// add cost indicator to query results
		var queryStatus = $("#query-status");
		if (queryStatus.size() > 0) {
			if (queryStatus.text().indexOf("Query running") > -1) {
				queryStatus.removeClass("costAnnotated");
			}
			if (!queryStatus.hasClass("costAnnotated")) {
				var text = queryStatus.html();
				var matches = text.match(/(\d+\.?\d*) (MB|GB|KB) processed/);
				if (matches != null && matches.length > 1) {
					queryStatus.addClass("costAnnotated");
					var gb = matches[1];
					if (matches[2] == "MB") {
						gb = gb/1024;
					}
					else if (matches[2] == "KB") {
						gb = gb/(1024*1024);
					}
					var costInCents = Math.round(0.5*gb*10)/10;
					queryStatus.html(text.substring(0, text.length-1) + ', <strong>Cost: ' + costInCents + '&cent;</strong>)');
				}
			}
		}

		var resultTable = $('#result-table');
		if(resultTable.size() > 0){
		      var lower = new Date('01-01-1990');
		      var upper = new Date('01-01-2100');

	          resultTable.find('tr.records-row td').each(function(tdI, td){
	               var ts = td.innerHTML;

	               if(parseInt(ts) > 0){
	                   var d = new Date();
	                   d.setTime(parseInt(ts)/1000);
	                   if(d > lower && d < upper){
	                	   td.innerHTML = d.toLocaleString().replace(/\sGMT\S*/, '');
	                   }
	               }
	           });
		}

		// make sure the page is scrollable
		removeHeightFromRecords();
	}, 500);

	// make results rows clickable to expand
	setInterval(function() {
		$(".row-number").css("background-color", "#F9EDBE");

		$(".records-cell").css("max-width", "1000px").css("overflow", "hidden");

		$(".row-number").off();
		$(".row-number").click(function(e){
			var rowNum = $(e.target);
			var hidden = true;
			if (rowNum.parent().find("pre").size() > 0) {
				hidden = false;
			}
			if (hidden) {
				rowNum.parent().find(".records-cell").each(function(index) {
					try{
						var newText = JSON.stringify(JSON.parse($(this).html()), null, 2);
						$(this).html("<pre style=\"overflow:auto\">");
						$(this).children().text(newText);
    			}
					catch(e) {
						$(this).html("<pre style=\"overflow:auto\">" + $(this).html() + "</pre>");
    			}

				});
			}
			else {
				rowNum.parent().find(".records-cell").each(function(index) {
					$(this).html($(this).children().html());
				});
			}
		});

	},1000);
});

function hideGraph() {
	$('#chart').remove();
	showGraphsDiv.show();
	hideGraphButton.hide();
}

function addGraphButtonsToPage() {
	var downloadButton = $('#csv-download');
	if (downloadButton.size() !== 0) {
		if (downloadButton.parent().find('#showGraphsDiv').size() === 0) {
			showGraphsDiv.insertBefore(downloadButton);
		}
		if (downloadButton.parent().find('#hideGraphButton').size() === 0) {
			hideGraphButton.insertBefore(downloadButton);
		}
	}
}

function showGraph(chartType) {
	var data = getDataArrayFromResults(chartType);

    data = JSON.stringify(data);
    data = encodeURIComponent(data);

    var uri = chrome.extension.getURL("resources/chart.html?chartType=" + chartType + "&data=" + data);
	var iframe = $('<iframe id="chart"></iframe>');
	iframe.attr('src', uri);
	iframe.css('width', '100%');
	iframe.css('height', '300px');
	$('#content-panel-main .content-header').parent().prepend(iframe);

	showGraphsDiv.hide();
	hideGraphButton.show();
}

function createGraphButtons() {
	timeseriesGraphButton = $('<div id="timeseriesGraphButton" class="goog-inline-block jfk-button jfk-button-standard jfk-button-collapse-right" role="button" style="-webkit-user-select: none;" tabindex="0">Timeseries Graph</div>');
	columnXYGraphButton = $('<div id="columnXYGraphButton" class="goog-inline-block jfk-button jfk-button-standard jfk-button-collapse-right" role="button" style="-webkit-user-select: none;" tabindex="0">Column XY Graph</div>');
	hideGraphButton = $('<div id="hideGraphButton" class="goog-inline-block jfk-button jfk-button-standard jfk-button-collapse-right" role="button" style="-webkit-user-select: none;" tabindex="0">Hide Graph</div>');

	showGraphsDiv = $('<span id="showGraphsDiv"></span>');
	showGraphsDiv.append(timeseriesGraphButton);
	showGraphsDiv.append(columnXYGraphButton);

	addHoverToGraphButtons();
	addEventHandlersToGraphButtons();

	hideGraphButton.hide();
}

function addEventHandlersToGraphButtons() {
	timeseriesGraphButton.click(function() {
		showGraph('timeseries');
	});

	columnXYGraphButton.click(function() {
		showGraph('columnXY');
	});

	hideGraphButton.click(function() {
		hideGraph();
	});
}

function addHoverToGraphButtons() {
	var buttons = [timeseriesGraphButton, columnXYGraphButton, hideGraphButton];

	$.each(buttons, function(i, button) {
		button.hover(function() {
			button.toggleClass('jfk-button-hover');
		});
	});
}




function getDataArrayFromResults(chartType) {
	var retVal = [];

	var headerCells = $('#result-table .records-header:not(.records-filler):not(:first-child)');
	var header = [];
	for (var i = 0; i < headerCells.length; i++) {
		header.push($(headerCells[i]).text());
	}
	retVal.push(header);

	var rows = $('#result-table .records-row');
	for (var i = 0; i < rows.length; i++) {
		var row = $(rows[i]);
		var cols = row.find('.records-cell:not(.records-filler)');
		var rowArray = [];
		for (var j = 0; j < cols.length; j++) {
			var col = $(cols[j]);
			if (j == 0) {
				if (chartType == 'timeseries') {
					rowArray.push(Date.parse(col.text()));
				}
				else if (chartType == 'columnXY') {
					rowArray.push(col.text());
				}
			}
			else {
				if (isNumeric(col.text())) {
					rowArray.push(parseFloat(col.text()));
				}
				else {
					rowArray.push(0);
				}

			}
		}
		retVal.push(rowArray);
	}
	return retVal;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function removeHeightFromRecords() {
	$('.records').css('height', '');
}

function clickButton(sb) {
	var pos = sb.offset();
	var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("mousedown", true, true, window,
	    0, pos.left, pos.top, 0, 0, false, false, false, false, 0, null);
	sb[0].dispatchEvent(evt);

	evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("mouseup", true, true, window,
	    0, pos.left, pos.top, 0, 0, false, false, false, false, 0, null);
	sb[0].dispatchEvent(evt);

	evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window,
	    0, pos.left, pos.top, 0, 0, false, false, false, false, 0, null);
	sb[0].dispatchEvent(evt);
}
