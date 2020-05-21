
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
