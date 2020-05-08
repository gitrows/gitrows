const fetch=require('node-fetch');
const base64=require('base-64');
const atob=base64.decode;
const btoa=base64.encode;

const CSV = {
	parse:require('csv-parse/lib/sync'),
	stringify: require('csv-stringify/lib/sync')
};

const response=require('./lib/response.js');
const util=require('./lib/util.js');

module.exports=class GITROWS{
	constructor(options){
		this._defaults();
		this.options(options);
	}
	_defaults(){
		const defaults={
			ns:'github',
			branch:'master',
			message:'GitRows API Post (https://gitrows.com)',
			author:{name:"GitRows",email:"api@gitrows.com"},
			csv:{delimiter:","},
			strict:false,
			default:null
		};
		Object.keys(this).forEach(key=>delete this[key]);
		this.options(defaults);
		return this;
	}
	reset(){
		return this._defaults();
	}
	pull(path){
		let self=this;
		return new Promise(function(resolve, reject) {
			let headers={};
			const pathData=GITROWS._parsePath(path)||{};
			if (!pathData.path) reject(response(400));
			self.options(pathData);
			if(!GITROWS._isValidPath(self.options())) reject(response(400));
			if (self.user!==undefined&&self.token!==undefined&&self.ns=='github')
				headers["Authorization"]="Basic "+btoa(self.user+":"+self.token);
			let url=GITROWS._apiFromPath(self.options());
			if (self.ns=='gitlab') url+="?ref="+self.branch;
			fetch(url,{
				headers: headers,
			})
			.then(r=>{
				if (!r.ok) reject(response(r.status));
				resolve(r.json())}
			)
			.catch((e) => console.error('Error:', e));
		});
	}
	push(path,obj,sha,method='PUT'){
			let self=this;
			return new Promise(function(resolve, reject) {
				if (!self.token) reject(response(401));
				const pathData=GITROWS._parsePath(path)||{};
				if (!pathData.path) reject(response(400));
				self.options(pathData);
				if(!GITROWS._isValidPath(self.options())) reject(response(400));
				let data={
					"branch":self.branch
				};
				if (typeof obj!='undefined'&&obj)
					data.content=btoa(self.type.toLowerCase()=='csv'?CSV.stringify(obj,{header:true}):JSON.stringify(obj));
				if (typeof sha!='undefined')
					data.sha=sha;
				let headers={
					'Content-Type': 'application/json',
				};
				switch (self.ns) {
					case 'gitlab':
						headers['Authorization']="Bearer "+self.token;
						data.encoding='base64';
						data.commit_message=self.message;
						data.author_name=self.author.name;
						data.author_email=self.author.email;
						break;
					default:
						headers['Authorization']="Basic " + btoa(self.user + ":" + self.token);
						data.message=self.message;
						data.committer=self.author;
				}
				let url=GITROWS._apiFromPath(self.options());
				fetch(url,{
					method:method,
					headers: headers,
					body:JSON.stringify(data),
				})
				.then(r=>{
					if (!r.ok) reject(response(r.status));
					resolve(response(r.status));
				})
					//resolve(method!=='DELETE'?r.json():response(r.status));
				.catch((e) => console.error('Error:', e));
			});
	}
	create(path,obj={}){
		let method=this.ns=='gitlab'?"POST":"PUT";
		return this.push(path,obj,null,method);
	}
	drop(path){
		let self=this;
		if (self.ns=='github')
				return self.pull(path).then(d=>self.push(path,null,d.sha,'DELETE'));
		return self.push(path,null,null,'DELETE');
	}
	get(path,query){
		let self=this;
		return new Promise(function(resolve, reject) {
			const pathData=GITROWS._parsePath(path)||{};
			if (!pathData.path) reject(response(400));
			self.options(pathData);
			if(!GITROWS._isValidPath(self.options())) reject(response(400));
			if (pathData.resource){
				query=query||{};
				query.id=pathData.resource;
			}
			const url=GITROWS._urlFromPath(self.options(),true);
			return fetch(url)
			.then(
				r=>{
					if (!r.ok) reject(response(r.status));
					return r.text();
				}
			)
			.then(t=>{
				let data=self.parseContent(t);
				if (data&&typeof query != 'undefined'){
					data=GITROWS.where(data,query);
					let aggregates=Object.keys(query)
					  .filter(key => key.startsWith('$'))
					  .reduce((obj, key) => {
					    obj[key] = query[key];
					    return obj;
					  }, {});
					if(Object.keys(aggregates).length)
						data=GITROWS._aggregate(data,aggregates);
				}
				resolve(data);
			})
			.catch(f=>console.log(f));
		});
	}
	add(path,data){
		let self=this,base=[],columns;
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					base=self.parseContent(atob(d.content));
					if (self.strict){
						self.columns=self.columns||GITROWS._columns(base);
						data=GITROWS._columnsApply(data,self.columns,self.default);
					}
					if (!Array.isArray(base))
						base=[base];
					if (Array.isArray(data))
						base.push(...data);
					else
						base.push(data);
					self.push(path,base,d.sha).then(r=>resolve(r)).catch(e=>reject(e));
				}
			)
			.catch(f=>{
				base=data;
				self.push(path,base).then(r=>resolve(r)).catch(e=>reject(e));
			})
			.finally(resolve(response(200)));
		});
	}
	delete(path,id){
		let self=this,base=[];
		return new Promise(function(resolve, reject) {
			const pathData=GITROWS._parsePath(path);
			self.options(pathData);
			if (pathData.resource&&typeof id=='undefined')
				id=pathData.resource;
			self.pull(pathData)
			.then(
				d=>{
					base=self.parseContent(atob(d.content));
					let data=GITROWS.where(base,{id:'not:'+id});
					if (JSON.stringify(base) !== JSON.stringify(data))
						self.push(path,data,d.sha).then(r=>resolve(r)).catch(e=>reject(e));
				}
			)
			.finally(resolve(base));
		});
	}
	/*static where(obj,filter){
		if (typeof filter=='undefined'||Object.keys(filter).length==0) return obj;
		if(obj.constructor !== Array && typeof filter.id!='undefined'){
			if (!~filter.id.indexOf('not:'))
				return [obj[filter.id]];
			else {
				delete obj[filter.id.split(':').pop()];
				return obj;
			}
		}
		obj=Object.values(obj);
		Object.keys(filter).forEach((key) => {
			if (key.indexOf('$')==0) return;
			let value=filter[key];
			if (value.indexOf(':')>-1){
				value=value.split(':');
				switch (value[0].toLowerCase()) {
					case 'gt':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]>value[1]);
						break;
					case 'gte':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]>=value[1]);
						break;
					case 'lt':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]<value[1]);
						break;
					case 'lte':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]<=value[1]);
						break;
					case 'not':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]!=value[1]);
						break;
					case 'eq':
						obj = obj.filter(item=>item[key]!==undefined&&item[key]==value[1]);
						break;
					case 'startswith':
					case '^':
						obj = obj.filter(item=>item[key]!==undefined&&typeof item[key]=='string'&&item[key].startsWith(value[1]));
						break;
					case 'endswith':
					case '$':
						obj = obj.filter(item=>item[key]!==undefined&&typeof item[key]=='string'&&item[key].endsWith(value[1]));
						break;
					default:

				}
			} else
			obj = obj.filter(item=>item[key]!==undefined&&item[key]==value);
		});
		return obj;
	}*/
	static _parsePath(path){
		if (typeof path=='object') return path;
		if (GITROWS._isUrl(path)){
			return GITROWS._parseUrl(path);
		}
		//@see: https://regex101.com/r/DwLNHW/4
		const regex = /(((?:(?<=@)(?<ns>[\w\.]+)\/)?(?:(?<owner>[\w-]+)?\/)(?<repo>[\w-]+)((?:#)(?<branch>[\w-]+))?)|(?:\.))\/(?:(?<=\/)(?<path>[\w-\.\/]+\.(?<type>json|csv)))(?:\/(?<=\/)(?<resource>[\w]+))?/mg;
		let result=regex.exec(path)||{};
		return result.groups;
	}
	static _parseUrl(url){
		//@see https://regex101.com/r/S9zzb9/1
		const regex = /http(?:s?):\/\/(?<ns>github|gitlab).com\/(?<owner>[\w-]+)\/(?<repo>[\w-\.]+)\/(?:(?:-\/)?(?:blob\/)(?<branch>(?<=blob\/)[\w]+)\/)?(?<path>[\w\/\-\.]+\.(?<type>json|csv))/gm;
		let result=regex.exec(url)||{};
		return result.groups;
	}
	static _pathFromUrl(url){
		let data=GITROWS._parseUrl(url);
		if (!GITROWS._isValidPath(data)) return null;
		data.branch=data.branch?'/#'+data.branch:'';
		return `@${data.ns}/${data.owner}/${data.repo}${data.branch}/${data.path}`;
	}
	static _urlFromPath(path,raw=false){
		let data=typeof path=='object'?path:GITROWS._parsePath(path);
		if (!GITROWS._isValidPath(data)) return null;
		data.branch=data.branch||'master';
		if (!data.ns||data.ns=='github'){
			data.server=raw?'raw.githubusercontent.com':'github.com';
			data.format=raw?'':'blob/';
			return `https://${data.server}/${data.owner}/${data.repo}/${data.format+data.branch}/${data.path}`;
		}
		data.server=data.server||'gitlab.com';
		data.format=raw?'raw':'blob';
		return `https://${data.server}/${data.owner}/${data.repo}/-/${data.format}/${data.branch}/${data.path}`;
	}
	static _apiFromPath(path){
		let data=typeof path=='object'?path:GITROWS._parsePath(path);
		if (!GITROWS._isValidPath(data)) return null;
		if (!data.ns||data.ns=='github'){
			data.server='api.github.com';
			return `https://${data.server}/repos/${data.owner}/${data.repo}/contents/${data.path}`;
		}
		data.server=data.server||'gitlab.com';
		data.project=encodeURIComponent(data.owner+'/'+data.repo);
		data.path=encodeURIComponent(data.path);
		return `https://${data.server}/api/v4/projects/${data.project}/repository/files/${data.path}`;
	}
	static _isValidPath(obj){
		let mandatory=['ns','owner','repo','path'];
		return mandatory.every(x=>x in obj);
	}
	static _pluck(obj,keys){
		let returnAsValues=false;
		if(!Array.isArray(keys)){
			if (keys=='*') return obj;
			keys=[keys];
			returnAsValues=true;
		}
		obj=Object.values(obj);
		let result=[];
		obj.forEach((item, i) => {
			result.push({});
			for (let key in item) {
				if (~keys.indexOf(key)) {
					if (returnAsValues)
						result[i]=item[key];
					else
						result[i][key]=item[key];
				}
			}
		});
		return result;
	}
	static _aggregate(obj,aggregates){
		let data={},length=0,sum=0;
		for (let key in aggregates) {
			let items=aggregates[key]=='*'?'*':aggregates[key].split(',').map(s=>s.trim());
			switch (key) {
				case '$select':
					data=GITROWS._pluck(obj,items);
					break;
				case '$count':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							data['count('+item+')']=GITROWS._pluck(obj,item).filter(e=>e.length).length;
						});
					else data['count('+items+')']=obj.filter(e=>e).length;
					break;
				case '$sum':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=GITROWS._pluck(obj,item);
							sum=column.reduce((prev, curr) => !isNaN(curr)?prev+(+curr):NaN,0);
							data['sum('+item+')']=isNaN(sum)?null:sum;
						});
					else return;
					break;
				case '$avg':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=GITROWS._pluck(obj,item);
							length=column.filter(e=>e.length).length;
							sum=column.reduce((prev, curr) => !isNaN(curr)?prev+(+curr):0,0);
							data['avg('+item+')']=sum!=0?sum/length:null;
						});
					else return;
				case '$min':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=GITROWS._pluck(obj,item);
							let min=Math.min( ...column);
							data['min('+item+')']=isNaN(min)?null:min;
						});
					else return;
					break;
				case '$max':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=GITROWS._pluck(obj,item);
							let max=Math.max( ...column);
							data['max('+item+')']=isNaN(max)?null:max;
						});
					else return;
					break;
				default:

			}
		}
		return data;
	}
	static _isUrl(url){
		/*
		*	@see https://gist.github.com/dperini/729294
		*	MIT © Diego Perini
		*/
		const regex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
		return regex.test(url);
	}
	static _columns(obj){
		let columns=new Set();
		if (!Array.isArray(obj))
			Object.keys(obj).forEach(item =>columns.add(item));
		else
			obj.forEach(row => Object.keys(row).forEach(item =>columns.add(item)));
		return Array.from(columns);
	}
	static _columnsApply(obj,columns,defaultValue=null){
		if (!Array.isArray(obj)){
			columns.forEach(item => obj[item]=obj[item]||defaultValue);
			Object.keys(obj).forEach((key) => {if(!~columns.indexOf(key)) delete obj[key];});
		}
		else
			obj.forEach((row,index) => obj[index]=GITROWS._columnsApply(row,columns));
		return obj;
	}
 	getColumns(path){
		return this.get(path).then(data=>GITROWS._columns(data));
	}
	parseContent(content){
		let self=this;
		let data=null;
		try {
			data=JSON.parse(content);
			self.type='json';
		} catch (e) {
			try {
				data=CSV.parse(content,{
				  columns: true,
				  skip_empty_lines: true
				});
				self.type='csv';
			} catch (e){}
		} finally {
			return data;
		}
	}
	options(obj){
		let self=this;
		const allowed=['server','ns','owner','repo','branch','path','user','token','message','author','csv','type','columns','strict','default'];
		if (typeof obj=='undefined'){
			let data={};
			allowed.forEach((item, i) => {
				data[item]=this[item];
			});
			return data;
		}
		for (let key in obj) {
			if (allowed.includes(key)&&typeof obj[key]!=='undefined') this[key]=obj[key];
		}
		return self;
	}
}
