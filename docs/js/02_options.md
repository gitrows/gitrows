
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
## Repo related options

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

## Data format related options

You can set these output options:

* `csv`	the option accepts only an object with the property `delimiter`, others might be added in future versions
* `type`	either `json` or `csv` - in most cases there is no need to set this as GitRows determines the type by the data file extension and by parsing its content, but might be useful for debugging purposes
* `columns` either determined by the data file entries or set as an `Array` with the column names - only applied if `strict` is `true`
* `strict` if set to `true` GitRows will enforce the column scheme found in the data file or set by the columns option for all added data entries
* `default` the default value used in strict mode for amending entries with missing column data
