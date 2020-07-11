const Util={

	asc:(obj,key)=>obj.sort((a,b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0)),

	desc:(obj,key)=>obj.sort((a,b) => (a[key] < b[key]) ? 1 : ((b[key] < a[key]) ? -1 : 0)),

	limit:(obj,a,b)=>(typeof b=='undefined'||isNaN(b))?obj.slice(0,a):obj.slice(b,a+b),

	where:(obj,filter)=>{
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
			let value=filter[key].toString();
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
					case 'starts':
					case '^':
						obj = obj.filter(item=>item[key]!==undefined&&typeof item[key]=='string'&&item[key].toLowerCase().startsWith(value[1].toLowerCase()));
						break;
					case 'ends':
					case '$':
						obj = obj.filter(item=>item[key]!==undefined&&typeof item[key]=='string'&&item[key].toLowerCase().endsWith(value[1].toLowerCase()));
						break;
					case 'contains':
					case '*':
						obj = obj.filter(item=>item[key]!==undefined&&typeof item[key]=='string'&&~item[key].toLowerCase().indexOf(value[1].toLowerCase()));
						break;

					default:

				}
			} else
			obj = obj.filter(item=>typeof item[key]!='undefined'&&item[key]==value);
		});
		return obj;
	},

	pluck:(obj,keys)=>{
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
	},

	aggregate:(obj,aggregates)=>{
		let data={},length=0,sum=0;
		for (let key in aggregates) {
			let items=aggregates[key]=='*'?'*':aggregates[key].split(',').map(s=>s.trim());
			switch (key) {
				case '$select':
					data=Util.pluck(Array.isArray(data)?data:obj,items);
					break;
				case '$count':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							data['count('+item+')']=Util.pluck(obj,item).filter(e=>e.toString().length).length;
						});
					else data['count('+items+')']=obj.filter(e=>e).length;
					break;
				case '$sum':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=Util.pluck(obj,item);
							sum=column.reduce((prev, curr) => !isNaN(curr)?prev+(+curr):NaN,0);
							data['sum('+item+')']=isNaN(sum)?null:sum;
						});
					else return;
					break;
				case '$avg':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=Util.pluck(obj,item);
							length=column.filter(e=>e.toString().length).length;
							sum=column.reduce((prev, curr) => !isNaN(curr)?prev+(+curr):0,0);
							data['avg('+item+')']=sum!=0?sum/length:null;
						});
					else return;
					break
				case '$min':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=Util.pluck(obj,item);
							let min=Math.min( ...column);
							data['min('+item+')']=isNaN(min)?null:min;
						});
					else return;
					break;
				case '$max':
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let column=Util.pluck(obj,item);
							let max=Math.max( ...column);
							data['max('+item+')']=isNaN(max)?null:max;
						});
					else return;
					break;
				case '$order':
					data=Array.isArray(data)?data:obj;
					if (Array.isArray(items))
						items.forEach((item, i) => {
							let values=item.split(':');
							if (!values.length==2) return;
							if (values[1]=='asc') data=Util.asc(data,values[0]);
							if (values[1]=='desc') data=Util.desc(data,values[0]);
						});
					else return;
					break;
				default:
					data=obj;
			}
		}
		if (aggregates['$limit']){
			values=aggregates['$limit'].toString().split(',');
			data=Util.limit(data,+values[0],+values[1]);

		}
		return data;
	},

	columns:(obj)=>{
		let columns=new Set();
		if (!Array.isArray(obj))
			Object.keys(obj).forEach(item =>columns.add(item));
		else
			obj.forEach(row => Object.keys(row).forEach(item =>columns.add(item)));
		return Array.from(columns);
	},

	typeof:(value)=>{
		let primitive=typeof value,format=null;
		switch (primitive) {
			case 'number':
				if (Number.isFinite(value)){
					if (Number.isInteger(value)) {
						primitive='integer';
						format='int32';
					} else {
						format='float';
					}
				} else if (Number.isNaN(value))
					primitive='NaN';
				break;
			case 'object':
				if (Array.isArray(value)) primitive='array';
				break;
			case 'bigint':
				primitive='integer';
				format='int64';
				break;
			case 'string':
				//Test for base64 encoding
				if (value.slice(-1)=='=' && /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/.test(value))
					format='byte'
				//Test for rfc 3339 full-date
				if (/^[0-9]+-(?:0[1-9]|1[012])-(?:0[1-9]|[12][0-9]|3[01])$/gm.test(value))
					format='date';
				//Test for rfc 3339 date-time
				if (/^[0-9]+-(?:0[1-9]|1[012])-(?:0[1-9]|[12][0-9]|3[01])[Tt](?:[01][0-9]|2[0-3]):(?:[0-5][0-9]):(?:[0-5][0-9]|60)(?:\.[0-9]+)?(?:[Zz]|[\+|\-](?:[01][0-9]|2[0-3]):[0-5][0-9])$/gm.test(value))
					format='date-time';
				break;
			default:
		}
		let result={'type':primitive};
		if (format) result.format=format;
		return result;
	},

	types:(obj)=>{
		let result={};
		const order=['number','string'];// higher index takes precedence
		const precedence=(item,type) => typeof result[item]!='undefined'&&order.indexOf(type)<order.indexOf(result[item]) ? result[item] : type;
		if (Util.typeof(obj).type=='object'&&Object.keys(obj))
			Object.keys(obj).forEach(item => result[item]=Util.typeof(obj[item]));
		else
			obj.forEach(row => Object.keys(row).forEach(item => result[item]=precedence(item,Util.typeof(row[item]))));
		return result;
	},

	columnsApply:(obj,columns,defaultValue=null)=>{
		if (!Array.isArray(obj)){
			columns.forEach(item => obj[item]=obj[item]||defaultValue);
			Object.keys(obj).forEach((key) => {if(!~columns.indexOf(key)) delete obj[key];});
		}
		else
			obj.forEach((row,index) => obj[index]=Util.columnsApply(row,columns));
		return obj;
	},

	valuesApply:(obj,values,query)=>{
		if (!Array.isArray(obj)){
			obj=Object.assign(obj, values)
		}
		else
			obj.forEach((row,index) => obj[index]=Util.where([row],query).length?Util.valuesApply(row,values):row);
		return obj;
	},

	btoa: string => typeof window === 'undefined'?Buffer.from(string, 'utf-8').toString('base64'):window.btoa(string),

	atob: string => typeof window === 'undefined'?Buffer.from(string, 'base64').toString('utf-8'):window.atob(string),

	removeEmpty:(obj)=>{
	  Object.keys(obj).forEach(k =>
	    (obj[k] && typeof obj[k] === 'object') && removeEmpty(obj[k]) ||
	    (!obj[k] && obj[k] !== undefined) && delete obj[k]
	  );
	  return obj;
	},

	mime:(extension)=>{
		const mimetypes={
			csv:'text/csv',
			json:'application/json',
			md:'text/markdown',
			yaml:'application/x-yaml'
		}
		return mimetypes[extension]||'application/octet-stream';
	}
}
module.exports=Util;
