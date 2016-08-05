var timeseriesGraphButton = null;
var columnXYGraphButton = null;
var showGraphsDiv = null;
var hideGraphButton = null;
var hasResized = false;

$(document).ready(function() {
	createGraphButtons();
	modifyAndKeepOpenValidatorBox();
	var t = setInterval(function() {
		// check if results exist
		if ($('#body') && $('#outer-body') && $('#main') && !hasResized) {
			hasResized = true;
			$('#body').height(15000);
			$('#outer-body').height(15000);
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
				var matches = text.match(/(\d+\.?\d*) (TB|GB|MB|KB) (processed)/);
				if (matches !== null && matches.length > 1) {
					var costInCents = getCostInCentsFromDataSize(matches[1], matches[2]);
					queryStatus.addClass("costAnnotated");
					queryStatus.html(text.substring(0, text.length-1) + ', <strong>Cost: ' + costInCents + '&cent;</strong>)');
				}
			}
		}

		// parse dates
		var resultTable = $('.records-table');
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
				var style = "overflow:auto; line-height:15px";
				var preTag = "<pre style=\"" + style + "\">";
				rowNum.parent().find(".records-cell").each(function(index) {
					try{
						var newText = JSON.stringify(JSON.parse($(this).html()), null, 2);
						$(this).html(preTag);
						$(this).children().text(newText);
    			}
					catch(e) {
						$(this).html(preTag + $(this).html() + "</pre>");
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

var hasFoundStatusBox = false;
function modifyAndKeepOpenValidatorBox() {
	// make sure validator is always open
	setInterval(function() {
		if ($('.validate-status-box').length > 0) {
				$('.validate-status-box').removeClass('ng-hide');
				if (!hasFoundStatusBox) {
						hasFoundStatusBox = true;
						var statusBox = document.getElementsByClassName('query-validate-status-text')
						var observer = new MutationObserver(function(mutations) {
						  mutations.forEach(function(mutation) {
								var text = $(statusBox).text();
								var matches = text.match(/(\d+\.?\d*) (TB|GB|MB|KB) (when run)/);
								if (matches !== null && matches.length > 1) {
									var costInCents = getCostInCentsFromDataSize(matches[1], matches[2]);
									console.log(costInCents);
									if ($('.streak-query-cost').length == 0) {
											$(statusBox).parent().append('<span><strong class="streak-query-cost"></strong></span>')
									}
									$('.streak-query-cost').html('Cost: ' + costInCents + '&cent;');
								}
								else {
									$('.streak-query-cost').html('');
								}
						  });
						}).observe(statusBox[0], { subtree: true, characterData: true });;
				}
		}


	}, 500);

}

function getCostInCentsFromDataSize(num, units) {
	var tb = num;
	if (units == "GB") {
		tb = tb/1024;
	}
	else if (units == "MB") {
		tb = tb/(1024*1024);
	}
	else if (units == "KB") {
		tb = tb/(1024*1024*1024);
	}
	return Math.round(500*tb*100)/100;
}

function hideGraph() {
	$('#chart').remove();
	showGraphsDiv.show();
	hideGraphButton.hide();
}

function addGraphButtonsToPage() {
	var actions = $('.content-actions');
	if (actions.size() === 0 || actions.children().size() === 0) {
		return;
	}
	if (actions.find('#showGraphsDiv').size() === 0) {
		actions.prepend(showGraphsDiv);
	}
	if (actions.find('#hideGraphButton').size() === 0) {
		actions.prepend(hideGraphButton);
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
	var headerCells = $('.records-table thead td:not(.records-filler):not(:first-child)');
	var header = [];
	for (var k = 0; k < headerCells.length; k++) {
		header.push($(headerCells[k]).text());
	}
	retVal.push(header);

	var rows = $('.records-table .records-row');
	for (var i = 0; i < rows.length; i++) {
		var row = $(rows[i]);
		var cols = row.find('td:not(.records-filler):not(:first-child)');
		var rowArray = [];
		for (var j = 0; j < cols.length; j++) {
			var col = $(cols[j]);
			if (j === 0) {
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
