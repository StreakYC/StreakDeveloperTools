var sidebar = null;
var expandTemplateButton = null;

var timeseriesGraphButton = null;
var columnXYGraphButton = null;
var showGraphsDiv = null;
var hideGraphButton = null;

var datasetQueries = new Object();
var lastDatasetSelected = '';

$(document).ready(function() {
	createGraphButtons();
	createTemplateExpansionButton();

	var t = setInterval(function() {
		// check if results exist
		if ($('#content-panel-main').height() != 15000) {
			$('#content-panel-main').height(15000);
			var evt = document.createEvent('UIEvents');
			evt.initUIEvent('resize', true, false,window,0);
			window.dispatchEvent(evt);
		}

		// add run expansion button
		var saveQueryButton = $('#query-save');
		if (saveQueryButton.size() != 0) {
			if (saveQueryButton.parent().find('#expand-query').size() == 0) {
				expandTemplateButton.insertBefore(saveQueryButton);
			}
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
					var costInCents = Math.round(3.5*gb*10)/10;
					queryStatus.html(text.substring(0, text.length-1) + ', <strong>Cost: ' + costInCents + '&cent;</strong>)');
				}
			}
		}
		
		// make results rows clickable to expand
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
		
		// refresh dataset queries
		refreshDatasetQueries();
		
		// add handler item to dataset menus to query entire dataset
		var datasets = $('.tables-dataset-row');
		for (var i = 0; i < datasets.length; i++) {
			attachEventHandlerToDataSetRow($(datasets[i]));
		}
		
		// add menu item to query data set
		addQueryDatasetMenuItem();
		
		// add 'add all' row to schema table
		addAddAllRow();
		
	}, 500);
	
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
					$(this).html("<pre style=\"overflow:auto\">" + $(this).html() + "</pre>");
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
	var downloadButton = $('#download');
	if (downloadButton.size() != 0) {
		if (downloadButton.parent().find('#showGraphsDiv').size() == 0) {
			showGraphsDiv.insertBefore(downloadButton);
		}
		if (downloadButton.parent().find('#hideGraphButton').size() == 0) {
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
	iframe.css('height', '300px')
	$('#content-panel-main .content-header').parent().prepend(iframe)

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
};

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



function getDatasetNames() {
	var dataSetEles = $(".tables-dataset-id-text");
	var datasetNames = [];
	for (var i = 0; i < dataSetEles.length; i++) {
		datasetNames.push($(dataSetEles[i]).text());
	}
	return datasetNames;
}

function expandTemplatesInQueryPressed(e) {
	var query = getQueryBoxContents();

	if (query.indexOf(':first') > -1 || query.indexOf(':last') > -1) {
		query = replaceFirstLastTemplates(query);
	}

	if (query.indexOf('funnel') > -1) {
		query = funnelQueryFromString(query);
	}

	fillInQuery(query);
}

function replaceFirstLastTemplates(query) {
	// var datasetNames = getDatasetNames();
	// for (var i = 0; i < datasetNames.length; i++) {
	// 	console.log(datasetNames[i]);
	// }
	alert(':first and :last templates not implemented yet');
}

function readQueryBox() {
	var presFromCode = $('.CodeMirror-lines div div').last().find('pre');
	var retVal = '';
	for (var i = 0; i < presFromCode.length; i++) {
		retVal += $(presFromCode[i]).text() + '\n';
	}
	return retVal;
}

function getFirstTableInDataset(dataset) {
	expandDataset(dataset);
	return $('#tables').find('[id*=' + dataset + '][id*=tableId]').first().find('.tables-table-id-text').text();
}

function getLastTableInDataset(dataset) {
	expandDataset(dataset);
	return $('#tables').find('[id*=' + dataset + '][id*=tableId]').last().find('.tables-table-id-text').text();
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

function expandDataset(dataset) {
	var datasetRows = $('.tables-dataset-row');
	for (var i = 0; i < datasetRows.length; i++) {
		var row = $(datasetRows[i]);
		var name = row.find('.tables-dataset-id-text').text();
		if (name == dataset) {
			if (row.find('.tables-dataset-icon')[0].className.indexOf('collapsed') > -1) {
				clickButton(row.find('.tables-dataset-icon'));
			}
		}
	}
}

function addAddAllRow() {
	var table = $('.schema-table');
	if (table.length > 0 && !$(table[0]).hasClass('functionalityAdded')) {
		table.addClass('functionalityAdded');
		var tableBody = table.children().first();
		var firstRow = tableBody.children().first();
		var clone = firstRow.clone();
		clone.find('.schema-table-field').text('Add All Fields');
		clone.find('.schema-table-field').css("background-color", "#F9EDBE");
		clone.find('.schema-table-type').text('');
		clone.click(function(e){
			var old = firstRow.find('.schema-table-field').text();
			var rows = tableBody.children();
			var toInsert = '';
			for (var i = 0; i< rows.length - 1; i++) {
				toInsert += rows.slice(i, i+1).find('.schema-table-field').text() + ', ';
			}
			toInsert = toInsert.substring(0, toInsert.length-2);
			
			var schemaTableField = firstRow.find('.schema-table-field'); 
			schemaTableField.text(toInsert);
			clickButton(schemaTableField);
			schemaTableField.text(old);
		});
		tableBody.append(clone);
	}
};

function addQueryDatasetMenuItem() {
	var menu = $($('.goog-menu-vertical')[1]);
	if (menu.length > 0 && menu.find('#queryDataSetItem').length == 0) {
		var newElement = $(menu.children()[menu.children().length-1]).clone();
		newElement.attr('id', 'queryDataSetItem');
		newElement.find('.goog-menuitem-content').text('Query Dataset');
		newElement.hover(function() {
			newElement.addClass('goog-menuitem-highlight');
		},
		function() {
			newElement.removeClass('goog-menuitem-highlight');
		});
		newElement.click(function(e){
			var minusColon = lastDatasetSelected.substring(lastDatasetSelected.indexOf(':') + 1, lastDatasetSelected.length);
			var expando = $('.tables-dataset-row[datasetid*=' + minusColon + ']').find('.tables-dataset-icon');
			if (expando.hasClass('tables-dataset-icon-collapsed')) {
				clickButton(expando);
				refreshDatasetQueries();
			}
			fillInQuery(datasetQueries[lastDatasetSelected]);
		});
		menu.append(newElement);
	}
};

function removeHeightFromRecords() {
	$('.records').css('height', '');
};

function refreshDatasetQueries() {
	var eles = $('#tables').children();
	for (var i = 0; i < eles.length; i++) {
		if ($(eles[i]).hasClass('tables-dataset-row')) {
			var query = 'SELECT  FROM ';
			var foundCount = 0;
			for (var j = i+1; j < eles.length; j++) {
				if ($(eles[j]).hasClass('table-nav-link')) {
					query += '[' + $(eles[i]).attr('datasetid') + '.' + $(eles[j]).attr('data-tooltip') + '],'
					foundCount++;
				}
				else {
					if (foundCount > 0) {
						query = query.substring(0, query.length-1);
					}
					else {
						query = '';
					}
					datasetQueries[$(eles[i]).attr('datasetid')] = query;
					break;
				}
			}
		}
	}
};

function attachEventHandlerToDataSetRow(dataSetRow) {
	var menu = dataSetRow.find('.tables-dataset-menu');
	if (!dataSetRow.hasClass('handlerAttached')) {
		menu.click(function(e) {
			lastDatasetSelected = dataSetRow.attr('datasetid');
			dataSetRow.addClass('handlerAttached');
			console.log(lastDatasetSelected);
		});
	}
};


function runQuery(query) {
	fillInQuery(query);
	clickButton($("#query-run"));
};

function fillInQuery(query) {
	
	clickButton($("#query-history-button"));
	var savedQueries = $('.queries-table-content');

	if (savedQueries.length == 0) {
		alert('You must have at least one saved query for this feature to work');
	}
	else {
		var oldDataSql = savedQueries.last().attr('data-sql');
		var oldDataId = savedQueries.last().attr('data-id');

		savedQueries.last().attr('data-sql', query);
		savedQueries.last().attr('data-id', oldDataId + 'A');

		clickButton(savedQueries.last());

		savedQueries.last().attr('data-sql', oldDataSql);
		savedQueries.last().attr('data-id', oldDataId);		
	}
};

function getQueryBoxContents() {
	var preTags = $(".CodeMirror-lines").children().first().children().last().children();
	if (preTags.size() == 0) {
		return "";
	}
	
	var retVal = "";
	preTags.each( function(index, element) {
		retVal += $(this).text() + "\n";
	});
	retVal = retVal.trim();
	
	return retVal;
};

function normalizeTitle(title) {
	title = title.trim();
	if (title.charAt(title.length-1) == ';') {
		title = title.substring(0, title.length-1);
	}
	return title;
};

function createTemplateExpansionButton() {
	expandTemplateButton = $("<div id=\"expand-query\" class=\"jfk-button jfk-button-standard goog-inline-block\" role=\"button\" style=\"-webkit-user-select: none;\" aria-disabled=\"false\" aria-label=\"foo\" data-tooltip=\"This will expand dataset:first/last toi the first or last table in the specified dataset.\" data-tooltip-align=\"b,c\" data-tooltip-delay=\"1000\" tabindex=\"0\">Expand Templates</div>");
	expandTemplateButton.click(expandTemplatesInQueryPressed);
};


function isOnLastResultPage() {
	var navStr = $('.page-number').text();
	navStr = navStr.substring(navStr.indexOf('-')+1);
	navStr = navStr.split(' ');
	if (navStr[0] == navStr[2]) {
		return true;
	}

	return false;
};

function getResultsOffPage(includeHeader) {
	var retVal = [];
	var offset = 0;
	if (includeHeader) {
		var headerCells = $('.records-header');
		var headerVals = [];
		for (var i = 0; i < headerCells.length; i++) {
			headerVals.push($(headerCells[i]).text());
		}
		retVal[0] = headerVals;
		offset = 1;
	}



	var rows = $('.records-row');
	for (var i = 0; i < rows.length; i++) {
		var rowCells = $(rows[i]).children();
		var row = [];
		for (var j = 0; j < rowCells.length; j++) {
			row.push($(rowCells[j]).text());
		}
		retVal[i + offset] = row;
	}
	return retVal;
};

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
};

/************************************************
** Funnel query generation
*************************************************/

function breakApartByLine(string) {
	return string.match(/[^\r\n]+/g);
}

/** string - a line-separated list of pairs (the space is required):
funnel
table t
joinColumn j
nameColumn n
steps eventName1,eventName2, ...
- table is likely [events.dev] or [events.prod]
- joinColumn is likely userKey or sessionId
- nameColumn is likely name
- timestampColumn is likely timestamp
- include a line "percents" if you want percentages
 */
function funnelQueryFromString(string)
{
	var lines = string.match(/[^\r\n]+/g);  // break apart by line
	var params = {"table":"[events.prod]",
				  "joinColumn":"sessionId", 
				  "nameColumn":"name",
				  "timestampColumn":"timestamp",
				  "hasGroupBy":false,
				  "percents":false};

	for (var i = 1; i < lines.length; i++) {
		var lineParams = lines[i].split(" ");
		if (lineParams.length === 1) {
			params[lineParams[0]] = true;
		} else if (lineParams.length >= 2) {
			var param = lineParams[0];
			var value = lineParams.slice(1).join(" ");
			params[param] = value;
		}
	}

	var stepsArray = params["steps"].split(",");
	var steps = [];
	for (var i=0; i < stepsArray.length; i++) {
		var stepParam = stepsArray[i].split(" ");
		var stepObject = {
			name: stepParam[0]
		};
		if (stepParam.length === 2) {
			stepObject.groupBy = stepParam[1];
			params.hasGroupBy = true;
		}
		steps.push(stepObject);
	}
	params["steps"] = steps;
	var query = orderedFunnelQuery(params);
	query = addCommentedTemplate(lines,query);
	return query;
}

function addCommentedTemplate(lines,query)
{
	query += "\n";
	for (var i = 0; i < lines.length; i++) {
		query += "// " + lines[i] + "\n";
	}
	return query;
}

function indent(n) {
	return Array(n+1).join(" ");
}

function orderedFunnelQuery(params)
{
	var query = "";
	query += "SELECT";
	for (var i = 0; i < params.steps.length; i++) {
		if (params.steps[i].groupBy) {
			query += " " + params.steps[i].groupBy + i + ",";	
		}
	}
	if (!params.hasGroupBy) {
		query += ' "funnel" AS funnel,';
	}
	for (var i = 0; i < params.steps.length; i++) {
		query += " COUNT(min_timestamp" + i + ") AS " + params.steps[i].name + "_" + i;
		if (i === params.steps.length - 1 && (!params.percents || i === 0)) {
			query += "\n";
		} else {
			query += ",";
		}
		if (params.percents && i > 0) {
			query += " 100*COUNT(min_timestamp" + i + ")/COUNT(min_timestamp" + (i-1) + ") AS " + params.steps[i].name + "_percent_" + i;
			if (i === params.steps.length - 1) {
				query += "\n";
			} else {
				query += ",";
			}
		}
	}
	query += "FROM\n";
	query += orderedFunnelRollupSubquery(params);
	if (params.hasGroupBy) {
		query += "GROUP EACH BY ";
		var numGroupBys = 0;
		for (var i = 0; i < params.steps.length; i++) {
			if (params.steps[i].groupBy) {
				if (numGroupBys > 0) {
					query += ", ";
				}
				query += params.steps[i].groupBy + i;	
				numGroupBys++;
			}
		}
		query += "\n";	
	}
	return query;	
}

function orderedFunnelRollupSubquery(params) {
	var query = "";
	query += " (SELECT ";
	query += params.joinColumn + '0';
	for (var i = 0; i < params.steps.length; i++) {
		query += ", MIN(timestamp" + i + ") AS min_timestamp" + i;
		if (params.steps[i].groupBy) {
			query += ", " + params.steps[i].groupBy + i;			
		}
	}	
	query += "\n";
	query += indent(1) + "FROM\n";	
	query += orderedFunnelSubquery(params, params.steps.length-1);
	query += " GROUP EACH BY " + params.joinColumn + '0';
	for (var i = 0; i < params.steps.length; i++) {
		if (params.steps[i].groupBy) {
			query += ", " + params.steps[i].groupBy + i;	
		}
	}
	query += ")\n";
	return query;
}

function orderedFunnelSubquery(params, stepNumber) {
	var query = "";
	query += indent(params.steps.length-stepNumber+2) + "(SELECT ";
	query += params.joinColumn + "0";
	for (var i = 0; i < stepNumber; i++) {
		query += ", timestamp" + i;
		if (params.steps[i].groupBy) {
			query += ", " + params.steps[i].groupBy + i;			
		}
	}
	query += ", IF(timestamp" + (stepNumber - 1) + " < timestamp" + stepNumber + ", timestamp" + stepNumber + ", null) AS timestamp" + stepNumber;
	if (params.steps[stepNumber].groupBy) {		
		query += ", IF(timestamp" + (stepNumber - 1) + " < timestamp" + stepNumber + ", " + params.steps[i].groupBy + stepNumber + ", null) AS " + params.steps[i].groupBy + stepNumber;		
	}
	query += "\n";
	query += indent(params.steps.length-stepNumber+3) + "FROM\n";
	var tableAlias;
	if (stepNumber === 1) {
		// base case
		query += orderedFilterTableSubquery(params, stepNumber-1);
		tableAlias = "s" + (stepNumber-1);
	} else {
		// recurse
		query += orderedFunnelSubquery(params, stepNumber-1);
		tableAlias = "t" + (stepNumber-1);
	}

	query += indent(params.steps.length-stepNumber+3) + "LEFT JOIN EACH\n";
	query += orderedFilterTableSubquery(params, stepNumber);

	query += indent(params.steps.length-stepNumber+3) + "ON " + tableAlias + "." + params.joinColumn + "0" + " = " + "s" + stepNumber + "." + params.joinColumn + stepNumber + "\n";
	query += indent(params.steps.length-stepNumber+2) + ") AS t" + stepNumber + "\n";
	return query;
}

function orderedFilterTableSubquery(params, stepNumber) {
	var query = "";
	var step = params.steps[stepNumber];
	query += indent(params.steps.length-stepNumber+3) + "(SELECT " + params.joinColumn + " AS " + params.joinColumn + stepNumber;
	query += ", " + params.timestampColumn + " AS timestamp" + stepNumber;
	if (step.groupBy) {
		query += ", " + step.groupBy + " AS " + step.groupBy + stepNumber;
	}
	query += " FROM " + params.table;
	query += ' WHERE ' + params.nameColumn + ' = "' + step.name + '"';
	query += ") AS s" + stepNumber + "\n";
	return query;
}