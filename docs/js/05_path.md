
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
