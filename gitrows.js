const fetch=require('node-fetch');

const CSV = {
	parse:require('csv-parse/lib/sync'),
	stringify: require('csv-stringify/lib/sync')
};

const Response=require('./lib/response.js');
const Util=require('./lib/util.js');
const GitPath=require('./lib/gitpath.js');

module.exports=class Gitrows{
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
					data.content=Util.btoa(self.type.toLowerCase()=='csv'?CSV.stringify(obj,{header:true}):JSON.stringify(obj));
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
					//resolve(method!=='DELETE'?r.json():Response(r.status));
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
			const pathData=GitPath.parse(path)||{};
			if (!pathData.path) reject(Response(400));
			self.options(pathData);
			if(!GitPath.isValid(self.options())) reject(Response(400));
			if (pathData.resource){
				query=query||{};
				query.id=pathData.resource;
			}
			const url=GitPath.toUrl(self.options(),true);
			return fetch(url)
			.then(
				r=>{
					if (!r.ok) reject(Response(r.status));
					return r.text();
				}
			)
			.then(t=>{
				let data=self.parseContent(t);
				if (data&&typeof query != 'undefined'){
					data=Util.where(data,query);
					let aggregates=Object.keys(query)
					  .filter(key => key.startsWith('$'))
					  .reduce((obj, key) => {
					    obj[key] = query[key];
					    return obj;
					  }, {});
					if(Object.keys(aggregates).length)
						data=Util.aggregate(data,aggregates);
				}
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
					base=self.parseContent(Util.atob(d.content));
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
			})
			.finally(resolve(Response(200)));
		});
	}
	update(path,data,query){
		let self=this,base=[],columns;
		const pathData=GitPath.parse(path)||{};
		return new Promise(function(resolve, reject) {
			self.pull(path)
			.then(
				d=>{
					base=self.parseContent(Util.atob(d.content));
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
					base=self.parseContent(Util.atob(d.content));
					const diff=Util.where(base,query);
					const data = base.filter(x => !diff.includes(x));
					if (JSON.stringify(base) !== JSON.stringify(data))
						self.push(path,data,d.sha).then(r=>resolve(Response(204))).catch(e=>e);
				}
			);
		});
	}
 	getColumns(path){
		return this.get(path).then(data=>Util.columns(data));
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
