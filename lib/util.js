module.exports = {
	asc:(obj,key)=>obj.sort((a,b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0)),
	desc:(obj,key)=>obj.sort((a,b) => (a[key] < b[key]) ? 1 : ((b[key] < a[key]) ? -1 : 0)),
	limit:(obj,a,b)=>(typeof b=='undefined')?obj.slice(0,a):obj.slice(b,a+b),
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
}
