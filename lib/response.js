const description=require('./descriptions.js');

module.exports=(code,message={})=>{
	let response={
		code:code,
		message:message
	};
	if (!response.message.description)
		response.message.description=description[code]||description['428'];
	return response;
}
