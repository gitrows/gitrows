
# Filters

## Filtering results

For simple matching if a value is present (e.g. an id) supply the field name and required value. You can also use a number of operators in the value field for comparison:

* `not:`	equals not
* `lt:`		less than
* `lte:`	less than or equal
* `gt:`		greater than
* `gte:`	greater than or equal
* `^:`		starts with, alias: `starts:`
* `*:`		contains text, alias: `contains:`
* `$:`		ends with, alias: `ends:`

The string comparison is case insensitive.

```js
gitrows.get(path,{'some_numerical_field':'gt:10'});
```

You can also supply an array of expressions per field name. All expressions will be handled as logical `AND`. This is especially useful for selecting ranges:

```js
gitrows.get(path,{'some_numerical_field':['gt:10','lt:20']});
```

## Aggregate Functions

Instead of retrieving data entries you can use aggregate functions that are prefixed with the dollar sign `$` and followed by the column name:

* `'$count':'*'`	counts the records in the data set
* `'$avg':'columnName'`	calculates the average of all numeric values in `columnName`
* `'$sum':'columnName'`	calculates the sum of all numeric values in `columnName`
* `'$min':'columnName'`	returns the smallest of all numeric values in `columnName`
* `'$max':'columnName'`	returns the largest of all numeric values in `columnName`

All filters are applied before the aggregation, so for example to get the average of all values larger than a certain number you can use `{value:'lt:number','$avg':value}`.

## Selecting Results

To specify the returned columns you can use `$select` with a comma delimited list of the column names you want to retrieve:

```js
gitrows.get(path,{'$select':'col1,col3,col5'});
```

## Sorting Results

You can order the result with `$order:'columnName:asc` or `$order:'columnName:desc` respectively and `$limit` the entries returned:

```js
gitrows.get(path,{'$order':'col1:asc','$limit':'0,5'});
```

GitRows' $limit behaves like MySQL's equivalent: If you supply one number, this will be maximum number of rows returned starting from the entry at index 0, if you give two comma delimited numbers, the first will be the offset and the second the number of rows.
