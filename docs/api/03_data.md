
# Working with Data

GitRows implements a full CRUD interface to you data so you can create, read, update, and delete information in your repository data files. In the current version you can only read public data files with the GitRows API. If need to access other methods or private repos you can join the private beta by sending an email to beta@gitrows.com or use the [js module](https://gitrows.com/docs/js/data) instead.

## GET

To read the complete data set from a `.json` or `.csv` file you make a get request to the API which has the basic structure of

```
https://api.gitrows.com/@namespace/owner/repository:branch/directory/file(.json|.csv)
```

Read more about the path structure and how to troubleshoot in the [Path section](https://gitrows.com/docs/api/path) of GitRows' documentation.

```shell
curl -i -X GET https://api.gitrows.com/@github/gitrows/data/iris.json
HTTP/2 200
date: Fri, 22 May 2020 12:42:25 GMT
content-type: application/json
content-length: 13859
access-control-allow-origin: *
server: GitRows API Server

[{"sepalLength":5.1,"sepalWidth":3.5,"petalLength":1.4,"petalWidth":0.2,"species":"setosa"},...]
```

You can add filtering and aggregation operators as query strings, e.g. `?species=setosa`. Learn more about the available options in the [Filters section](http://gitrows.com/docs/api/filters).

### Try the API

You can try the API with the API Explorer:

<div id="api-console" class="py-4" data-method="get"></div>

<!---
## put(path, *object* data)
> requires `token`

For adding or updating data (and deleting or creating new data files) you must set your username and an OAuth (personal access) token. Unless you feel particularly adventurous you should **never** do this in a production environment like a website. You can generate a new one in your [GitHub Developer Settings](https://github.com/settings/tokens):

```js
const options = {
 username:"yourUsername",
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
-->
