var savedQueries = null;
var sidebar = null;
var saveButton = null;
var datasetQueries = new Object();
var lastDatasetSelected = '';

$(document).ready(function() {
	loadSavedQueries();
	createSidebar();
	createSaveQueryButton();
	
	for (key in savedQueries) {
		addRowToSavedQueriesSidebar(key);
	}
	
	saveButton.click(function(e) {
		var query = getQueryBoxContents(); 
		if (!query) {
			showSaveQueryInstructions();
			return;
		}
		var lines = query.split('\n');
		var title = '';
		for (var i = 0; i < lines.length; i++) {
			if (lines[i].substring(0,2) == '--') {
				title = lines[i].substring(2);
			}
		}
		title = normalizeTitle(title);
		if (!title) {
			showSaveQueryInstructions();
		}
		else {
			var numBefore = Object.keys(savedQueries).length;
			savedQueries[title] = query;
			var numAfter = Object.keys(savedQueries).length;
			storeSavedQueries(savedQueries);
			if (numAfter > numBefore) {
				addRowToSavedQueriesSidebar(title);
			}
		}
	});
	
	var t = setInterval(function() {
		
		// add left sidebar for saved queries
		var size = $(".sidebar").size();
		if (size == 0) {
			$("#project-display").append(sidebar);
		}
		$(".records").removeAttr("style");
		
		// add save query button
		var runQueryButton = $('#query-run');
		if (runQueryButton.size() != 0) {
			if (runQueryButton.parent().find('#save-query').size() == 0) {
				saveButton.insertAfter(runQueryButton);
			}
		}
		
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
					$(this).html("<pre>" + $(this).html() + "</pre>");
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
}

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
}

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
}

function attachEventHandlerToDataSetRow(dataSetRow) {
	var menu = dataSetRow.find('.tables-dataset-menu');
	if (!dataSetRow.hasClass('handlerAttached')) {
		menu.click(function(e) {
			lastDatasetSelected = dataSetRow.attr('datasetid');
			dataSetRow.addClass('handlerAttached');
			console.log(lastDatasetSelected);
		});
	}
}


function runQuery(query) {
	fillInQuery(query);
	clickButton($("#query-run"));
}

function fillInQuery(query) {
	clickButton($("#query-history-button"));
	$(".queries-table-sql").last().html(query);
	clickButton($(".queries-table-row").last());
}


function loadSavedQueries() {
	var retrievedObject = localStorage.getItem('savedBigQueries');
	if (retrievedObject == null) {
		savedQueries = {};
	}
	savedQueries = JSON.parse(retrievedObject);
};

function storeSavedQueries(queries) {
	localStorage.setItem('savedBigQueries', JSON.stringify(queries));
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
}

function normalizeTitle(title) {
	title = title.trim();
	if (title.charAt(title.length-1) == ';') {
		title = title.substring(0, title.length-1);
	}
	return title;
}

function showSaveQueryInstructions() {
	alert('Type your query into the query box above and make sure to have one comment line (starts with --) with the name you want to save the query with.');
};
function createSavedQueryRow() {
	return $("<div class=\"tables-row tables-dataset-row\"><div class=\"tables-dataset-id overflow-ellipsis\"><span class=\"tables-dataset-id-text queryName\"></span></div><div class=\"tables-menu tables-dataset-menu\"></div></div>");
};

function createSaveQueryButton() {
	saveButton = $("<div id=\"save-query\" class=\"jfk-button jfk-button-primary goog-inline-block\" role=\"button\" style=\"-webkit-user-select: none;\" aria-disabled=\"false\" aria-label=\"foo\" data-tooltip=\"Enter a query above with a SQL comment of the name you wish to save.\" data-tooltip-align=\"b,c\" data-tooltip-delay=\"1000\" tabindex=\"0\">Save Query</div>");
};

function createSidebar() {
	sidebar = $("<div><div id=\"tables-header\"><div class=\"project-name sidebar overflow-ellipsis\">Saved Queries</div></div><div id=\"tables\" class=\"queryContainer\"></div></div>");
};

function addRowToSavedQueriesSidebar(title) {
	var q = createSavedQueryRow();
	q.find(".queryName").html(title);
	sidebar.find(".queryContainer").append(q);
	q.click(function(e) {
		fillInQuery(savedQueries[title]);
	});
	q.find(".tables-dataset-menu").click(function(e) {
		delete savedQueries[title];
		storeSavedQueries(savedQueries);
		q.remove();
	});
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
};