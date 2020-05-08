# GitRows

[![@latest](https://img.shields.io/npm/v/gitrows.svg)](https://www.npmjs.com/package/gitrows)

GitRows makes it easy to use and store data in GitHub and GitLab repos. You can read data stored in `.csv` and `.json` files from **all public repos** and read, create, update and delete data in **public or private repos** that you have access to, all with the benefit of version control.

GitRows works with `node` and in any modern `browser`. Alternatively learn more on [gitrows.com](https://gitrows.com) how to use GitRows' free API to integrate data into your websites/apps.


## Installation

As a package for `node` use npm:
```shell
npm i gitrows
```

You can use GitRows in the `browser` by including `gitrows.js` or `gitrows.min.js` from the `./dist` folder or using unpkg:
```js
<script src="https://unpkg.com/gitrows@latest/dist/gitrows.min.js"></script>
```

## Usage

### Basic

```js
// If you use GitRows as a module:
const Gitrows = require('gitrows');

// Init the GitRows client, you can provide options at this point, later or just run on the defaults
const gitrows = new Gitrows();

let path = '@github/nicolaszimmer/test-data/test.json';

gitrows.get(path)
 .then( (data) => {
  //handle (Array/Object)data
  console.log(data);
 })
 .catch( (error) => {
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

### The Path

To select the data file you can either paste the GitHub/GitLab file url from the browser, e.g.

```url
https://github.com/nicolaszimmer/test-data/blob/master/test.json
```

or use the GitRows API style:

```
@namespace/owner/repository#branch/directory/file(.json|.csv)
```

`@namespace` and `#branch` are optional and default to `github` and `master`, if you want to access a GitLab repository, use the `gitlab` namespace.


*Which notation to use?*

Although it's easier for a simple query to just paste the url I strongly encourage the use of the API style. After you have initially the namespace, owner, repository and/or branch either by calling a method with a path or by setting them with the `options()` method you can make subsequent calls by just providing `directory/file`:

```
./directory/file(.json|.csv)
```

The API style got it's name from its use with the free GitRows API tool which allows you to query all public repos with a consistent api call:

```
https://api.gitrows.com/@namespace/owner/repository#branch/path/file(.json|.csv)
```

Give it a try with our sample database from the basic use example: https://api.gitrows.com/nicolaszimmer/test-data/test.json If you are unsure about how a file url is translated into API style, you can use from `.lib/path.js` the `Path.fromUrl(url)` helper function or `Path.toUrl(path)` to check the corresponding repository url for a path.

### get(path[, filter])
The `get` method accepts as a second argument a filter object that compares keys and the corresponding values:

```js
let filter = {
 foo:'bar',
 number:'lt:99'
}
```

For simple matching if a value is present (e.g. an id) supply the field key and required value. You can also use a number of operators in the value field for comparison:

* `not:`	equals not
* `lt:`		less than
* `lte:`	less than
* `gt:`		greater than
* `gte:`	greater than or equal
* `^:`		starts with, alias: `startsWith`
* `$:`		ends with, alias: `endsWith`

For the GitRows API you append the filters as query parameters: https://api.gitrows.com/nicolaszimmer/test-data/test.json?title=foo

Instead of retrieving data entries you can use aggregate functions that are prefixed with the dollar sign `$` and followed by a colon the column name:

* `$count:*`	counts the records in the data set
* `$avg:columnName`	calculates the average of all numeric values in `columnName`
* `$sum:columnName`	calculates the sum of all numeric values in `columnName`
* `$min:columnName`	returns the smallest of all numeric values in `columnName`
* `$max:columnName`	returns the largest of all numeric values in `columnName`

All filters are applied before the aggregation, so for example to get the average of all values larger than a certain number you can use `{value:'lt:number','$avg':value}`.

To limit the returned columns you can use `$select` with a comma delimited list of the column names you want to retrieve:

```js
gitrows.get(path,{'$select':['col1','col3','col5']});
```

You can order the result with `$order:'columnName:asc` or `$order:'columnName:desc` respectively and `$limit` the entries returned:

```js
gitrows.get(path,{'$order':'col1:asc','$limit':'0,5'});
```

GitRows' $limit behaves like MySQL's equivalent: If you supply one number, this will be maximum number of rows returned starting from the entry at index 0, if you give two comma delimited numbers, the first will be the offset and the second the number of rows.

### add(path, data)
> requires `token`

For adding data (and deleting or creating new data files) you must set your username and an OAuth (personal access) token. Unless you feel particularly adventurous you should **never** do this in a production environment like a website. You can generate a new one in your [GitHub Developer Settings](https://github.com/settings/tokens):

```js
let options = {
 username:"yourUsername",
 token:"yourSecretToken"
};

let data = [
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

gitrows.add(path,data)
 .then((response)=>{
  //handle response, which has the format (Object){code:200,description='OK'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

GitRows accepts the data as an `Array` of `Objects` if you want to add one ore more entries (rows) or a single `Object` for appending one entry (row).

To if you want to enforce consistent data structures set `options({strict:true})`. If true, GitRows will check the columns (keys) used in your datafile and add the missing keys with the default value `NULL` or any other value you set with `options({default:''})`. You can also set the columns as an option with `options({columns:[]})`.

### delete(path, id:'')
> requires `token`

To delete an entry from data you must provide it's `id`, which may either be

* the entry's `id property`, if the data consists of an `Array` of `Objects`, e.g. `[{id:'0001', foo:'bar'}]`
* the `property name`, if the data consists of a single `Object`

```js
let remove = '0001';

gitrows.delete(path,remove)
 .then((response)=>{
  //handle response, which has the format (Object){code:200,description='OK'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

If you use the API style you may also append the `id` to the path and omit the second argument:

```
@namespace/owner/repository#branch/directory/file(.json|.csv)/id
```

### create(path[ ,data])
> requires `token`

To create a new data file programmatically you can use the the `create()` method, which optionally accepts initial data, that will be added upon creation:

```js
let newFilePath = '@github/nicolaszimmer/test-data/another-test.json';

gitrows.create(newFilePath)
 .then((response)=>{
  //handle response, which has the format (Object){code:200,description='OK'}
 })
 .catch((error)=>{
  //handle error, which has the format (Object){code:http_status_code,description='http_status_description'}
 });
```

### drop(path)
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

### options({key:'value'})
You can use the `options()` method to set or get the options of the GitRows instance. The available options and their default values are:
```js
{
  server: undefined,
  ns: 'github',
  owner: undefined,
  repo: undefined,
  branch: 'master',
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

The following options are data file repository related and may be overwritten by GitRows while parsing an url or API call:

* `server`	used in connection with `ns:'gitlab'`: You can use GitLab installations on other webservers than gitlab by providing its url, e.g. `gitlab.example.com`
* `ns`	either `github` or `gitlab`
* `owner`	repository owner
* `repo`	repository name
* `branch` select another than `master`
* `path`	directory and/or file name with extension

If you want to alter the contents of the data files you need to provide a username and access token for the selected namespace:

* `user`	a GitHub or GitLab username (may be omitted for GitLab)
* `token`	a GitHub or GitLab token

The commits are done with a standard message and authored by GitRows by default. Change if needed. This is useful for different GitRows instances committing to the same repo:

* `message`	commit message
* `author`	an object with the properties `name` and `email` to identify the committer

You can set these output options:

* `csv`	the option accepts only an object with the property `delimiter`, others might be added in future versions
* `type`	either `json` or `csv` - in most cases there is no need to set this as GitRows determines the type by the data file extension and by parsing its content, but might be useful for debugging purposes
* `columns` either determined by the data file entries or set as an `Array` with the column names - only applied if `strict` is `true`
* `strict` if set to `true` GitRows will enforce the column scheme found in the data file or set by the columns option for all added data entries
* `default` the default value used in strict mode for amending entries with missing column data


## Contributing to GitRows
To contribute, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively see the GitHub documentation on [creating a pull request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request).

## Contact

You can reach me at <nicolas@gitrows.com>

## License

Copyright © 2020, [Nicolas Zimmer](https://github.com/nicolaszimmer).
[MIT](LICENSE)
