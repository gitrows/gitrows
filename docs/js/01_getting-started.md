
# Getting Started

## What is GitRows?

GitRows makes it easy to use and store data in GitHub and GitLab repos. You can read data stored in `.csv` and `.json` files from **all public repos** and read, create, update and delete data in **public or private repos** that you have access to, all with the benefit of version control.

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
