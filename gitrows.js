const fetch=require('node-fetch');

const CSV = {
	parse:require('csv-parse/lib/sync'),
	stringify: require('csv-stringify/lib/sync')
};
const YAML = require('yamljs');

const Response=require('./lib/response.js');
const Util=require('./lib/util.js');
const GitPath=require('./lib/gitpath.js');

module.exports=class Gitrows{
	constructor(options){
		this._defaults();
		this.options(options);
		this._cache={};
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
		this._cache={};
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
			const pathData=GitPath.parse(path)||{};
			if (!pathData.path) reject(Response(400));
			self.options(pathData);
			if(!GitPath.isValid(self.options())) reject(Response(400));
			if (self.user!==undefined&&self.token!==undefined&&self.ns=='github')
				headers["Authorization"]="Basic "+Util.btoa(self.user+":"+self.token);
			let url=GitPath.toApi(self.options());
			if (self.ns=='gitlab') url+="?ref="+self.branch;
			fetch(url,{
				headers: headers,
			})
			.then(r=>{
				if (!r.ok) reject(Response(r.status));
				resolve(r.json())}
			)
			.catch((e) => console.error('Error:', e));
		});
	}
	push(path,obj,sha,method='PUT'){
			let self=this;
			return new Promise(function(resolve, reject) {
				if (!self.token) reject(Response(401));
				const pathData=GitPath.parse(path)||{};
				if (!pathData.path) reject(Response(400));
				self.options(pathData);
				if(!GitPath.isValid(self.options())) reject(Response(400));
				let data={
					"branch":self.branch
				};
				if (typeof obj!='undefined'&&obj)
					data.content=Util.btoa(Gitrows._stringify(obj,self.type));
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
						headers['Authorization']="Basic " + Util.btoa(self.user + ":" + self.token);
						data.message=self.message;
						data.committer=self.author;
				}
				let url=GitPath.toApi(self.options());
				fetch(url,{
					method:method,
					headers: headers,
					body:JSON.stringify(data),
				})
				.then(r=>{
					if (!r.ok) reject(Response(r.status));
					resolve(Response(r.status));
				})
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
	get(path,query,method){
		let self=this;
		self._meta={};
		self._data=null;
		return new Promise(function(resolve, reject) {
			const pathData=GitPath.parse(path)||{};
			if (!pathData.path) reject(Response(400));
			self.options(pathData);
			if(!GitPath.isValid(self.options())) reject(Response(400));
			if (pathData.resource){
				query=query||{};
				query.id=pathData.resource;
			}
			const url=GitPath.toUrl(self.options(),true);
			self._meta.repository={url:url,name:pathData.repo,owner:pathData.owner,ns:pathData.ns||'github'};
			self._meta.file={type:pathData.type,mime:Util.mime(pathData.type)};
			return self._pullOrFetch(url, method)
			.then(t=>{
				let data=Gitrows._parse(t,self.type);
				if (data)
					self._meta.count={total:data.length||0};
				if (data&&typeof query != 'undefined'){
					data=Gitrows._applyFilters(data,query);
					self._meta.count.query=data.length||0;
				}
				self._data=data;
				resolve(data);
			})
			.catch(f=>console.log(f));
		});
	}
	put(path,data){
		let self=this,base=[],columns;
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					base=Gitrows._parse(Util.atob(d.content),self.type);
					if (self.strict){
						self.columns=self.columns||Util.columns(base);
						data=Util.columnsApply(data,self.columns,self.default);
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
			});
		});
	}
	update(path,data,query){
		let self=this,base=[],columns;
		const pathData=GitPath.parse(path)||{};
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					base=Gitrows._parse(Util.atob(d.content),self.type);
					if (self.strict){
						self.columns=self.columns||Util.columns(base);
						base=Util.columnsApply(base,self.columns,self.default);
					}
					if (pathData.resource){
						query=query||{};
						query.id=pathData.resource;
					}
					if (typeof query=='undefined') resolve(Response(304));
					if (!Array.isArray(base))
						base=[base];
					base=Util.valuesApply(base,data,query);
					self.push(path,base,d.sha).then(r=>resolve(Response(202))).catch(e=>e);
				}
			);
		});
	}
	replace(path,data){
		let self=this,base=[],columns;
		const pathData=GitPath.parse(path)||{};
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					self.push(path,data,d.sha).then(r=>resolve(Response(202))).catch(e=>e);
				}
			);
		});
	}
	delete(path,query){
		let self=this,base=[];
		return new Promise(function(resolve, reject) {
			const pathData=GitPath.parse(path);
			self.options(pathData);
			if (pathData.resource){
				query=query||{};
				query.id=pathData.resource;
			};
			if (typeof query=='undefined') resolve(Response(304));
			self.pull(pathData)
			.then(
				d=>{
					base=Gitrows._parse(Util.atob(d.content),self.type);
					const diff=Util.where(base,query);
					const data = base.filter(x => !diff.includes(x));
					if (JSON.stringify(base) !== JSON.stringify(data))
						self.push(path,data,d.sha).then(r=>resolve(Response(204))).catch(e=>e);
				}
			);
		});
	}
 	columns(path){
		return this.get(path).then(data=>Util.columns(data));
	}
	types(path,query){
		return this.get(path,query).then(data=>Util.types(data));
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
	async test(path,constraint={}){
		let result=GitPath.parse(path)||{};
		if (!result.valid){
			if (result.repo&&constraint.fragment!==false&&constraint.file!==true) result.fragment=true;
			else return {...result,...Response(400)};
		} else result.fragment=false;
		const acl=await this._acl(path).then(r=>r).catch(e=>e);
		result={...result,...acl};
		if (acl.code) {
			result.valid=false;
			result.level='repo';
			return {...result,...Response(acl.code)};
		} else {
			result.valid=result.fragment;
			result={...result,...result.permissions};
			delete(result.permissions);
		}
		if (!result.fragment){
			const file=await this._isRepoFile(path).then(r=>r).catch(e=>e);
			result.valid=file===true;
			result.level='file';
			result={...result,...Response(file===true?200:404)};
		}
		Object.keys(constraint).forEach((item, i) => {
			if (result[item]!==constraint[item]) {
				result.valid=false;
				if (result.message&&Array.isArray(result.message.description))
					result.message.description.push(`Constraint Violation - ${item} must not be ${result[item]}`);
				else
					result={...result,...Response(400,{description:[`Constraint Violation - ${item} must not be ${result[item]}`]})};
			}
		});
		return result;
	}
	_acl(path){
		let self=this;
		const test=GitPath.parse(path)||{};
		if (!test.repo)
			return Promise.reject(Response(404));
		if (test.ns!='github')
			return Promise.reject(Response(501));
		const hash=`acl:${test.ns}:${test.owner}:${test.repo}`;
		if (typeof self._cache[hash]!='undefined')
			return new Promise((resolve, reject)=>self._cache[hash]?resolve(self._cache[hash]):reject(Response(404)));
		let headers={
			'Content-Type': 'application/json',
		};
		if (self.user&&self.token)
			headers['Authorization']="Basic " + Util.btoa(self.user + ":" + self.token);
		return fetch("https://api.github.com/repos/"+test.owner+'/'+test.repo,{headers:headers}).then(r=>{
			if (!r.ok){
				self._cache[hash]=null;
				return Response(404);
			}
			return r.json().then(data=>{
				const acl={'private':data.private,'permissions':data.permissions};
				self._cache[hash]=acl;
				return acl;
			})
		}).then(r=>r).catch(e=>e);
	}
	_listRepoContents(ns,owner,repo){
		let self=this;
		let test=GitPath.parse(ns);
		if (test.repo){
			ns=test.ns;
			owner=test.owner;
			repo=test.repo;
		}
		if (!ns||!owner||!repo)
			return Promise.reject(Response(400));
		if (ns!='github')
			return Promise.reject(Response(501));
		const hash=`files:${ns}:${owner}:${repo}`;
		if (typeof self._cache[hash]!='undefined')
			return new Promise((resolve, reject)=>self._cache[hash]?resolve(self._cache[hash]):reject(Response(404)));
		let headers={
			'Content-Type': 'application/json',
		};
		if (self.user&&self.token)
			headers['Authorization']="Basic " + Util.btoa(self.user + ":" + self.token);
		return fetch("https://api.github.com/repos/"+owner+'/'+repo+'/git/trees/master?recursive=1',{headers:headers}).then(r=>{
			if (!r.ok){
				self._cache[hash]=null;
				return Response(404);
			}
			return r.json().then(data=>{
				if (typeof data.tree =='undefined'||!Array.isArray(data.tree))
					return Response(404);
				let contents=[];
				data.tree.forEach((item, i) => {
					contents.push(item.path);
				});
				self._cache[hash]=contents;
				return contents;
			})
		}).then(r=>r).catch(e=>e);
	}
	_isRepoFile(path){
		let self=this;
		const test=GitPath.parse(path)||{};
		return self._listRepoContents(path).then(c=>c.findIndex(item => test.path.toLowerCase() === item.toLowerCase())>-1).catch(e=>e);
	}
	_getRepoTree(ns,owner,repo){
		let self=this;
		return self._listRepoContents(ns,owner,repo).then(c=>{
			let result={};
			c.forEach(p => p.split('/').reduce((o, k) => o[k] = o[k] || {}, result));
			return result;
		}).catch(e=>e);
	}
	static _applyFilters(data,query){
		data=Util.where(data,query);
		let aggregates=Object.keys(query)
			.filter(key => key.startsWith('$'))
			.reduce((obj, key) => {
				obj[key] = query[key];
				return obj;
			}, {});
		if(Object.keys(aggregates).length)
			data=Util.aggregate(data,aggregates);
			return data;
	}
	static _stringify(obj,type='json'){
		try {
			switch (type.toLowerCase()) {
				case 'csv':
					return Array.isArray(obj)?CSV.stringify(obj,{header:true}):null;
					break;
				case 'yaml':
					return YAML.stringify(obj,10);
					break;
				default:
					return JSON.stringify(obj,null,2);
			}
		} catch (e) {
			return null;
		}
	}
	static _parse(content,type='json'){
		type=type.toLowerCase();
		try {
			switch (type) {
				case 'csv':
					return CSV.parse(content,{columns:true,skip_empty_lines:true,cast:true});
					break;
				case 'yaml':
					return YAML.parse(content);
					break;
				default:
					return JSON.parse(content);
			}
		} catch (e) {
			return null;
		}
	}
	_pullOrFetch(url,method='fetch'){
		let self=this;
		if (method=='pull'){
			return self.pull(GitPath.fromUrl(url)).then(p=>{self._meta.repository.private=true;return Util.atob(p.content)}).catch(e=>e);
		}
		return fetch(url)
		.then(
			r=>{
				if (r.ok) {
					self._meta.repository.private=false;
					return r.text()
				};
				//retry by api if token is present
				if (self.user!==undefined&&self.token!==undefined&&self.ns=='github'){
					return self.pull(GitPath.fromUrl(url)).then(p=>{self._meta.repository.private=true;return Util.atob(p.content)}).catch(e=>e);
				}
				return Response(r.status);
			}
		);
	}
}
