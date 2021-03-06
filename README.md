Streak Developer Tools
======================

The Streak Developer Tools (SDT) is a chrome extension that currently adds functionality to BigQuery (see features below) and in the future will add other tools used internally at [Streak.com](http://www.streak.com). 

If you just want the extension - simply download from the [Chrome Web Store](https://chrome.google.com/webstore/detail/lfmljmpmipdibdhbmmaadmhpaldcihgd), you'll also get automatic updates. 
<br/>
* * * 
BigQuery Tools
--------------

###Save Named Queries

We felt the need to be able save queries and run them again later. While the query history in BigQuery is nice, it's sometimes hard to parse all the queries to find the one you want. We added a section in the left sidebar for saved queries.

To save a query simply type it into the query box. Also, make sure you add one line to the query which is a comment (starts with '--'). Whatever is in that comment will be the name of the saved query. Next, hit the save query button. It's as simple as that. This stores the query in your local storage so it is not shared with other users of the project and will not persist if you clear your local storage. We may store this online in the future.

<br/>
  
![Alt text](http://1.bp.blogspot.com/-v8w0EK1SKhE/UBgMZ4IZw4I/AAAAAAAAACQ/rS8PAekTaik/s1600/saveQuery.png)


###Query Across Datasets

At Streak, we have several tables in a dataset representing log information. Often we want to query across the entire dataset. While we could manually type all of the tables into the query, we added an option to the dataset drop down that does that for you. Simply select "Query Dataset" and the query box will be filled in for you with all the tables in the dataset.

<br/>

![Alt text](http://1.bp.blogspot.com/-kLkah1yMDH8/UBgNgAG5-cI/AAAAAAAAACg/fJhLKh5ArmI/s1600/queryDataset.png)


###Show Cost of Each Query

We also added the ability to see how much each query that you ran costs. Once the query completes, we added the cost (in US cents) next to the summary status of the query. The cost is calculated based on $0.035/GB processed.

<br/>

![Alt text](http://4.bp.blogspot.com/-4RQOVSpJtuY/UBgOcgLa8bI/AAAAAAAAACo/x4TqXi_c5EI/s1600/cost.png)


###Expand Multi-line Results

Since we store a lot of log data inside of BigQuery, including stack traces, many of our fields are multi-line strings which BigQuery doesn't display very well. The SDT allows you to click on any result row and expand it to show multi-line strings. Simply click on the row number in the results table to toggle multi-line on and off.

<br/>

![Alt text](http://1.bp.blogspot.com/-sKikZsfQFl8/UBgO6ayfQoI/AAAAAAAAACw/szPsrKJ9uJE/s1600/expando.png)


In order to put multi-line strings into BigQuery, make sure that your line endings are '\r' and not '\n' as those aren't supported by BigQuery.
Insert All Columns into SELECT Statements

###Automatically Convert Timestamps to Human Readable Format

AppEngine and BigQuery store timestamps as epoch time which is great for computers and computation, but not so good for a human to read. The extension automatically finds, parses and replaces epoch timestamps with a human friendly date/time rendering.

<br/>

![Alt text](http://4.bp.blogspot.com/-odeVU_y3Nhk/UBgb6wK-bmI/AAAAAAAAAF4/RaFBfzjfa8c/s1600/Screen+Shot+2012-07-31+at+10.19.14+AM.png)

###Insert All Columns into SELECT Statements


Sometimes you want to select every column in your query but typing each of them out manually takes time especially for tables with a large number of columns. In the schema description for a table, we've added a final yellow field called "Add All Columns" which you can press to insert all of the column names into your query.

<br/>

![Alt text](http://2.bp.blogspot.com/-E1l9IVkZHSs/UBgPvLG_tQI/AAAAAAAAADA/7AvsxkeZUz8/s1600/all.png)