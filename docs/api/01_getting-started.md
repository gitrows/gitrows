
# Getting Started

## What is GitRows?

GitRows makes it easy to use and store data in GitHub and GitLab repos. You can read data stored in `.csv` and `.json` files from **all public repos** and read, create, update and delete data in **public or private repos** that you have access to, all with the benefit of version control.

## Installation

GitRows provides a free REST API to all public repositories on GitHub and GitLab. The API url is always in the format:

```shell
https://api.gitrows.com/@namespace/owner/repository/path/to/file(.json|.csv)
```

You can easily convert any file url or check your API Path with the [Linter and Converter Tool](https://gitrows.com/linter).


## Usage

### Basic

```shell
curl -X GET https://api.gitrows.com/@github/gitrows/data/iris.json
```

returns a response similar to

```shell
HTTP/2 200
date: Thu, 21 May 2020 13:12:41 GMT
content-type: application/json
content-length: 13859
access-control-allow-origin: *
server: GitRows API Server

[{"sepalLength":5.1,"sepalWidth":3.5,"petalLength":1.4,"petalWidth":0.2,"species":"setosa"}, ... ]
```
