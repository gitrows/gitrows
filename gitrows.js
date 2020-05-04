const fetch=require('node-fetch');
const base64=require('base-64');
const atob=base64.decode;
const btoa=base64.encode;
const CSV = {
	parse:require('csv-parse/lib/sync'),
	stringify: require('csv-stringify/lib/sync')
};

module.exports=class GITROWS{
	constructor(options){
		this.message='GitRows API Post (https://gitrows.com)';
		this.author={name:"GitRows",email:"api@gitrows.com"};
		this.csv={delimiter:","};
		if (typeof options!='undefined'){
			for (let key in options){
				this[key]=options[key];
			}
		}
	}
	pull(path){
		let self=this;
		return new Promise(function(resolve, reject) {
			let headers={};
			const ns=GITROWS._getNamespace(path);
			path=ns.path;
			self.ns=ns.scope||self.ns;
			if (self.owner!==undefined&&self.token!==undefined)
				headers["Authorization"]="Basic "+btoa(self.owner+":"+self.token);
			let url=GITROWS.buildApiUrl(path,self.ns);
			fetch(url,{
				headers: headers,
			})
			.then(r=>{
				if (!r.ok) reject(r);
				resolve(r.json())}
			)
			.catch((e) => console.error('Error:', e));
		});
	}
	push(path,obj,sha,method='PUT'){
			let self=this;
			return new Promise(function(resolve, reject) {
				const ns=GITROWS._getNamespace(path);
				path=ns.path;
				self.ns=ns.scope||self.ns;
				let data={
					"branch":"master"
				};
				let type=(typeof self.type=='undefined')?GITROWS.getExtension(path):self.type;
				delete self.type;
				if (typeof obj!='undefined'&&obj)
					data.content=btoa(type=='csv'?CSV.stringify(obj,{header:true}):JSON.stringify(obj));
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
						headers['Authorization']="Basic " + btoa(self.owner + ":" + self.token);
						data.message=self.message;
						data.committer=self.author;
				}
				let url=GITROWS.buildApiUrl(path,self.ns);
				fetch(url,{
					method:method,
					headers: headers,
					body:JSON.stringify(data),
				})
				.then(r=>{
					if (!r.ok) reject(r);
					resolve(method!=='DELETE'?r.json():r.text())}
				)
				.catch((e) => console.error('Error:', e));
			});
	}
	create(path,obj={}){
		let method=this.ns=='gitlab'?"POST":"PUT";
		return this.push(path,obj,null,method);
	}
	drop(path){
		let self=this;
		if (self.ns=='github'){
				return self.pull(path).then(d=>self.push(path,null,d.sha,'DELETE'));
		} else
		return self.push(path,null,null,'DELETE');
	}
	get(path,query){
		let self=this;
		return new Promise(function(resolve, reject) {
			const parsed=GITROWS.parsePath(path);
			path=parsed.path;
			self.ns=parsed.ns||self.ns;
			if (parsed.resource){
				query=query||{};
				query.id=parsed.resource;
			}
			let url=GITROWS.buildStaticUrl(path,self.ns);
			fetch(url)
			.then(
				r=>{
					if (!r.ok) reject(r);
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
			.catch(f=>reject(f));
		});
	}
	add(path,data){
		let self=this,base=[];
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					base=self.parseContent(atob(d.content));
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
			.finally(resolve(base));
		});
	}
	delete(path,id){
		let self=this,base=[];
		return new Promise(function(resolve, reject) {
			const parsed=GITROWS.parsePath(path);
			path=parsed.path;
			self.ns=parsed.ns||self.ns;
			if (parsed.resource)
				id=parsed.resource;
			self.pull(path)
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
	static where(obj,filter){
		if (typeof filter=='undefined'||Object.keys(filter).length==0) return obj;
		if(obj.constructor !== Array && typeof filter.id!='undefined')
		 return [obj[filter.id]];
		obj=Object.values(obj);
		Object.keys(filter).forEach((key) => {
			if (key.indexOf('$')==0) return;
			console.log('key',key);
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
	}
	static buildApiUrl(path,ns,type){
		if (typeof path===undefined||path.indexOf('/')==-1)
			return false;
		let parts=path.split('/').filter(x=>x);
		let url='',server='';
		let extension='.'+(type||GITROWS.getExtension(path));
		if (path.indexOf(extension)>-1) extension='';
		switch (ns) {
			case 'gitlab':
			  server=this.server||'gitlab.com';
				url='https://'+server+'/api/v4/projects/'+encodeURIComponent(parts.shift()+'/'+parts.shift())+'/repository/files/'+encodeURIComponent(parts.join('/')+extension);
				break;
			default:
				server=this.server||'api.github.com';
				url='https://'+server+'/repos/'+parts.shift()+'/'+parts.shift()+'/contents/'+parts.join('/')+extension;
		}
		return url;
	}
	static buildStaticUrl(path,ns,type){
		if (typeof path===undefined||path.indexOf('/')==-1)
			return false;
			let parts=path.split('/').filter(x=>x);
			let url='',server='';
			let extension='.'+(type||GITROWS.getExtension(path));
			if (path.indexOf(extension)>-1) extension='';
			switch (ns) {
				case 'gitlab':
				  server=this.server||'gitlab.com';
					url='https://'+server+'/'+parts.shift()+'/'+parts.shift()+'/-/raw/master/'+parts.join('/')+extension;
					break;
				default:
				  server=this.server||'raw.githubusercontent.com';
					url='https://'+server+'/'+parts.shift()+'/'+parts.shift()+'/master/'+parts.join('/')+extension;
			}
			return url;
	}
	static getExtension(path,fallback='json'){
		if (path.split('/').pop().indexOf('.')==-1) return fallback;
		return path.split('.').pop().toLowerCase();
	}
	static _getNamespace(path){
		let scope='github',server;
		path=path.split('/').filter(e=>e);
		if (path[0].indexOf('@')>-1){
			let ns=path.shift();
			switch (ns.toLowerCase()) {
				case '@gitlab':
				case '@gitlab.com':
					scope='gitlab';
					break;
				case '@github':
				case '@github.com':
					scope='github';
					break;
				default:
					scope='gitlab';
					server=ns.substr(1);
			}
		}
		path='/'+path.join('/');
		return {scope:scope,path:path,server:server}
	}
	static _getResource(path){
		let regex=/\.(json|csv)$/gi,el=path.split('/').filter(e=>e);
		let pos=el.findIndex(e=>e.match(regex));
		let res=~pos?el.splice(pos+1).filter(e=>e).join('/'):undefined;
		res=res&&res.length?res:undefined;
		let repo=el.shift();
		let tree=el.join('/');
		return {resource:res,path:repo+'/'+tree,repo:repo,tree:tree}
	}
	static parsePath(path){
		if (GITROWS._isUrl(path)){

		}
		let ns=GITROWS._getNamespace(path);
		let res=GITROWS._getResource(ns.path);
		return {ns:ns.scope,resource:res.resource,path:res.path,repo:res.repo,tree:res.tree,server:ns.server}
	}
	static _parseUrl(url){
		const regex = /http(?:s?):\/\/(?<ns>github|gitlab).com\/(?<owner>\w+)\/(?<repo>[\w-\.]+)\/(?:(?:-\/)?blob\/master\/)?(?<path>[\w\/\.]+)/gm;
		let result=regex.exec(url);
		return result.groups;
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
		*	Taken from https://github.com/kevva/url-regex
		*	MIT © Kevin Mårtensson and Diego Perini
		*/
		const protocol = `(?:(?:[a-z]+:)?//)${options.strict ? '' : '?'}`;
		const auth = '(?:\\S+(?::\\S*)?@)?';
		const ip = ipRegex.v4().source;
		const host = '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)';
		const domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
		const tld = `(?:\\.${options.strict ? '(?:[a-z\\u00a1-\\uffff]{2,})' : `(?:${tlds.sort((a, b) => b.length - a.length).join('|')})`})\\.?`;
		const port = '(?::\\d{2,5})?';
		const path = '(?:[/?#][^\\s"]*)?';
		const regex = `(?:${protocol}|www\\.)${auth}(?:localhost|${ip}|${host}${domain}${tld})${port}${path}`;
		return RegExp(`(?:^${regex}$)`, 'i').test(url);
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
}
