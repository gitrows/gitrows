[![@latest](https://img.shields.io/npm/v/gitrows.svg)](https://www.npmjs.com/package/gitrows)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgitrows%2Fgitrows.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fgitrows%2Fgitrows?ref=badge_shield)

# Getting Started

## What is GitRows?

GitRows makes it easy to use and store data in GitHub and GitLab repos. You can read data stored in `.csv` and `.json` files from **all public repos** and read, create, update and delete data in **public or private repos** that you have access to, all with the benefit of version control. GitRows also supports basic `.yaml` file operations, mainly for reading and writing [OpenAPI documents](http://spec.openapis.org/oas/v3.0.3).

GitRows works with `node` and in any modern `browser`. Alternatively [learn more](https://gitrows.com/docs/api/getting-started) how to use GitRows' free API to integrate data into your websites/apps.


## Installation

As a package for `node` use npm:

```shell
npm i gitrows
```

You can use GitRows in the `browser` by including `gitrows.js` or `gitrows.min.js` from the `./dist` folder or using unpkg:

```html
<script src="https://unpkg.com/gitrows@latest/dist/gitrows.min.js"></script>
```

## Usage

### Basic

```js
// If you use GitRows as a module:
const Gitrows = require('gitrows');

// Init the GitRows client, you can provide options at this point, later or just run on the defaults
const gitrows = new Gitrows();

let path = '@github/gitrows/data/iris.json';

gitrows.get(path)
 .then( (data) => {
  //handle (Array/Object)data
  console.log(data);
 })
 .catch( (error) => {
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

# Options

You can configure various options to streamline your workflow with GitRows.

## options(*object* params)
You can use the `options()` method to set or get the options of the GitRows instance. The available options and their default values are:

```js
{
  server: undefined,
  ns: 'github',
  owner: undefined,
  repo: undefined,
  branch: 'HEAD',
  path: undefined,
  user: undefined,
  token: undefined,
  message: 'GitRows API Post (https://gitrows.com)',
  author: { name: 'GitRows', email: 'api@gitrows.com' },
  csv: { delimiter: ',' },
  type: undefined,
  columns: undefined,
  strict: false,
  default: null
}
```
## Repo related options

The following options are data file repository related and may be overwritten by GitRows while parsing an url or API call:

* `server`	used in connection with `ns:'gitlab'`: You can use GitLab installations on other webservers than gitlab by providing its url, e.g. `gitlab.example.com`
* `ns`	either `github` or `gitlab`
* `owner`	repository owner
* `repo`	repository name
* `branch` select another than `HEAD`
* `path`	directory and/or file name with extension

If you want to alter the contents of the data files you need to provide a username and access token for the selected namespace:

* `user`	a GitHub or GitLab username (may be omitted for GitLab)
* `token`	a GitHub or GitLab token

The commits are done with a standard message and authored by GitRows by default. Change if needed. This is useful for different GitRows instances committing to the same repo:

* `message`	commit message
* `author`	an object with the properties `name` and `email` to identify the committer

## Data format related options

You can set these output options:

* `csv`	the option accepts only an object with the property `delimiter`, others might be added in future versions
* `type`	either `json` or `csv` - in most cases there is no need to set this as GitRows determines the type by the data file extension and by parsing its content, but might be useful for debugging purposes
* `columns` either determined by the data file entries or set as an `Array` with the column names - only applied if `strict` is `true`
* `strict` if set to `true` GitRows will enforce the column scheme found in the data file or set by the columns option for all added data entries
* `default` the default value used in strict mode for amending entries with missing column data

# Working with Data

GitRows implements a full CRUD interface to you data so you can create, read, update, and delete information in your repository data files.

## get(path[, *object* filter, *string* method = 'fetch' | 'pull')
> requires `token` for **private repos only**

To read the complete data set from a `.json` or `.csv` file you pass the file path to the `.get()` method, which has the basic structure of

```
@namespace/owner/repository:branch/directory/file(.json|.csv)
```

Alternatively you can copy the file url form your browser and pass this instead. Read more about the path structure and how to troubleshoot in the [Path section](#path) of GitRows' documentation.

```js
const path = '@github/gitrows/data/iris.json';

gitrows.get(path)
 .then( (data) => {
  //handle (Array/Object)data
  console.log(data);
 })
 .catch( (error) => {
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

The `get` method accepts as a second argument a filter object which can be used with filtering and aggregation operators. Learn more about the possibilities in the [Filters section](#filters).

**For reading a file from a private repo you must set your username and token (see put() for more details). Please note that its impossible to decide from the returned status code if the file is private on GitHub or not, as it will always be 404 by GitHub's policy.**

As a third parameter you can set the mechanism for retrieving data from the repository server. It defaults to `fetch` which is sufficent for most use cases and avoids rate limit issues. However, as `fetch` uses the html `raw` endpoints, e.g. `https://https://raw.githubusercontent.com/`, this may lead to a caching latency of a few seconds. If your use case requires faster access times, try `pull` instead which queries the GitHub or GitLab content APIs.

## put(path, *object* data)
> requires `token`

For adding or updating data (and deleting or creating new data files) you must set your username and an OAuth (personal access) token. Unless you feel particularly adventurous you should **never** do this in a production environment like a website. You can generate a new one in your [GitHub Developer Settings](https://github.com/settings/tokens):

```js
const options = {
 user:"yourUsername",
 token:"yourSecretToken"
};

const data = [
 {
  id:"0003",
  title:"A New Title",
  content:"Some new content"
 },
 {
  id:"0004",
  title:"Another New Title"
 }
];

gitrows.options(options);

gitrows.put(path,data)
 .then((response)=>{
  //handle response, which has the format (Object){code:200,description='OK'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

GitRows accepts the data as an `Array` of `Objects` if you want to add one ore more entries (rows) or a single `Object` for appending one entry (row).

To if you want to enforce consistent data structures set `options({strict:true})`. If true, GitRows will check the columns (keys) used in your datafile and add the missing keys with the default value `NULL` or any other value you set with `options({default:''})`. You can also set the columns as an option with `options({columns:[]})`.

## update(path, *object* data[, *object* filter])
> requires `token`

To update an entry from data you must provide it's `id`, which may either be

* the entry's `id property`, if the data consists of an `Array` of `Objects`, e.g. `[{id:'0001', foo:'bar'}]`
* the `property name`, if the data consists of a single `Object`

**or**

a valid filter expession to update more than one entries and an entry of unknown id.

```js
const filter = {id:'0001'};

const data = {
	foo: "bar"
}

gitrows.update(path,data,filter)
 .then((response)=>{
  //handle response, which has the format (Object){code:202,description='Accepted'} if successful or (Object){code:304,description='Not modified'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

If you use the API style you may also append the `id` to the path and omit the second argument:

```
@namespace/owner/repository:branch/directory/file(.json|.csv)/id
```

## replace(path, *object* data)
> requires `token`

To update a data set that is not representing tabular data but a dictionary, or to swap a complete set, use the replace method

```js

const data = {
	foo: "bar"
}

gitrows.replace(path,data)
 .then((response)=>{
  //handle response, which has the format (Object){code:202,description='Accepted'} if successful or (Object){code:304,description='Not modified'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

## delete(path[, *object* filter])
> requires `token`

To delete an entry from data you must provide it's `id`, which may either be

* the entry's `id property`, if the data consists of an `Array` of `Objects`, e.g. `[{id:'0001', foo:'bar'}]`
* the `property name`, if the data consists of a single `Object`

**or**

a valid filter expession to delete more than one entries.

```js
const filter = {id:'0001'};

gitrows.delete(path,filter)
 .then((response)=>{
  //handle response, which has the format (Object){code:204,description='No content'} if successful or (Object){code:304,description='Not modified'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

If you use the API style you may also append the `id` to the path and omit the second argument:

```
@namespace/owner/repository:branch/directory/file(.json|.csv)/id
```

## types(path[, *object* {'$limit':'number'}])

Returns the columns and their data types which can be one of `string`, `number`, `integer`, `array` or `object`. The data types are detetced from the data set values. To speed detection up you can optionally pass a filter argument with the number of rows to be processed. If mixed values are found within a column, the following take precedence: `string` over `number` over `integer`.

```js
const limit = {'$limit':'10'};

gitrows.types(path,limit)
 .then((response)=>{
  //handle response, which has the format (Object){columnName:'type'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

# Working with Files

## create(path[ ,data])
> requires `token`

To create a new data file programmatically you can use the the `create()` method, which optionally accepts initial data, that will be added upon creation:

```js
let newFilePath = '@github/gitrows/data/another.json';

gitrows.create(newFilePath)
 .then((response)=>{
  //handle response, which has the format (Object){code:201,description='Created'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

## drop(path)
> requires `token`

To delete a data file programmatically you can use the the `drop()` method:

```js
gitrows.drop(path)
 .then((response)=>{
  //handle response, which has the format (Object){code:200,description='OK'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

# Path

To select the data file you can either paste the GitHub/GitLab file url from the browser, e.g.

```url
https://github.com/gitrows/data/blob/master/iris.json
```

or use the GitRows API style:

```
@namespace/owner/repository:branch/directory/file(.json|.csv|.yaml)
```

`@namespace` and `:branch` are optional and default to `github` and `master`, if you want to access a GitLab repository, use the `gitlab` namespace.


## Which notation to use?

Although it's easier for a simple query to just paste the url I strongly encourage the use of the API style. After you have initially set the namespace, owner, repository and/or branch either by calling a method with a path or by setting them with the `options()` method you can make subsequent calls by just providing `directory/file`:

```
./directory/file(.json|.csv|.yaml)
```

The API style got it's name from its use with the free GitRows API tool which allows you to query all public repos with a consistent api call:

```
https://api.gitrows.com/@namespace/owner/repository:branch/path/file(.json|.csv|.yaml)
```

Give it a try with our sample database from the basic use example: `https://api.gitrows.com/@github/gitrows/data/iris.json` If you are unsure about how a file url is translated into API style, you can use GitRow's [Linter and Converter Tool](https://gitrows.com/linter) to check and translate repo and API paths respectively.

## test(path [ ,constraint])

To check the path (GitRows API or url) and your permissions, GitRows provides a test method. Please note that the `admin|push|pull` permissions will only be visible if you have provided your `token`.

```js
let path='@github/gitrows/data/countries.json'

gitrows.test(path)
 .then((response)=>{
  //handle response, which has the format (Object){...resul}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

This example would have a response like

```
{
  valid: true,
  ns: 'github',
  owner: 'gitrows',
  repo: 'data',
  branch: undefined,
  path: 'countries.json',
  type: 'json',
  resource: undefined,
  fragment: false,
  private: false,
  admin: false,
  push: false,
  pull: true,
  level: 'file',
  code: 200,
  message: { description: 'OK' }
}
```

You can add optional constraints, e.g. to validate push access to the file:

```js
gitrows.test(path,{push:true})
 .then((response)=>{
  //handle response, which has the format (Object){...resul}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

which yields:

```
{
  valid: false,
  ns: 'github',
  owner: 'gitrows',
  repo: 'data',
  branch: undefined,
  path: 'countries.json',
  type: 'json',
  resource: undefined,
  fragment: false,
  private: false,
  admin: false,
  push: false,
  pull: true,
  level: 'file',
  code: 400,
  message: { description: 'Constraint Violation - push must not be false' }
}
```

The test method also accepts fragments:

- a repo `@github/gitrows/data`
- a directory `@github/gitrows/data/dir`

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

# Contributing to GitRows
To contribute, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

# Contact

You can reach me at <nicolas@gitrows.com>

# License

Copyright © 2020, [Nicolas Zimmer](https://github.com/nicolaszimmer).
[MIT](LICENSE)


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fgitrows%2Fgitrows.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fgitrows%2Fgitrows?ref=badge_large)
