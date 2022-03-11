
# Path

To select the data file you can either paste the GitHub/GitLab file url from the browser, e.g.

```url
https://github.com/gitrows/data/blob/master/iris.json
```

or use the GitRows API style:

```
@namespace/owner/repository:branch/directory/file(.json|.csv|.yaml)
```

`@namespace` and `:branch` are optional and default to `github` and `HEAD` (usually maps to `main` or `master`), if you want to access a GitLab repository, use the `gitlab` namespace.


## Which notation to use?

Although it's easier for a simple query to just paste the url I strongly encourage the use of the API style. After you have initially set the namespace, owner, repository and/or branch either by calling a method with a path or by setting them with the `options()` method you can make subsequent calls by just providing `directory/file`:

```
./directory/file(.json|.csv)
```

The API style got it's name from its use with the free GitRows API tool which allows you to query all public repos with a consistent api call:

```
https://api.gitrows.com/@namespace/owner/repository:branch/path/file(.json|.csv|.yaml)
```

Give it a try with our sample database from the basic use example: `https://api.gitrows.com/@github/gitrows/data/iris.json` If you are unsure about how a file url is translated into API style, you can use GitRow's [Linter and Converter Tool](https://gitrows.com/linter) to check and translate repo and API paths respectively.
