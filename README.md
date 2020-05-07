# GitRows

[![@latest](https://img.shields.io/npm/v/gitrows.svg)](https://www.npmjs.com/package/gitrows)

GitRows makes it easy to use and store data in GitHub and GitLab repos. You can read data stored in `.csv` and `.json` files from **all public repos** and read, create, update and delete data in **public or private repos** that you have access to.

GitRows works with `node` and in any modern `browser`. Alternatively learn more on [gitrows.com](https://gitrows.com) how to use GitRows' free API to integrate data into your websites/apps.


## Installation

As a package for `node` use npm:
```shell
npm i gitrows
```

You can include GitRows in the `browser` by including `gitrows.js` or `gitrows.min.js` from the `./dist` folder or using unpkg:
```js
<script src="https://unpkg.com/gitrows@latest/dist/gitrows.min.js">
```

## Usage

### Basic

```js
// If you use GitRows as a module:
const Gitrows=require('gitrows');

// Init the GitRows client, you can provide options at this point, later or just run on the defaults
const gitrows=new Gitrows();

/*
* You can either paste the GitHub/GitLab file url from the browser, e.g.
* https://github.com/nicolaszimmer/test-data/blob/master/test.json
* or use the GitRows API style @ns/repo/path/to/file
*/

let path='@github/nicolaszimmer/test-data/test.json';

gitrows.get(path)
 .then((data)=>{
  //handle (Array/Object)data
 })
 .catch((error)=>{
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

`@namespace` and `#branch` are optional and default to `github` and `master`


*Which notation to use?*

Although it's easier for a simple query to just paste the url I strongly encourage the use of the API style. After you have initially the namespace, owner, repository and/or branch either by calling a method with a path or by setting them with the `options()` method you can make subsequent calls by just providing `directory/file`:

```
./directory/file(.json|.csv)
```

The API style got it's name from its use with the GitRows API tool which allows you to query all public repos with a consistent and free api call:

```
https://api.gitrows.com/@namespace/owner/repository#branch/path/file(.json|.csv)
```

Give it a try with our sample database from the basic use example: https://api.gitrows.com/nicolaszimmer/test-data/test.json


### get(path [,filter])
The `get` method accepts as a second argument a filter object that compares keys and the corresponding values:

```js
let filter={
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
* `^:`		starts with
* `$:`		ends with

<--For a full list of supported operators checkout the [documentation](https://gitrows/docs/get#filters)-->


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
