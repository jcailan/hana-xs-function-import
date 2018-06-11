"use strict";

function _getTotalAmount(sSalesOrderId) {
	// implement your logic here ...
	
	// for simplicity of the demo just return a hardcoded value
	return (sSalesOrderId === "0100000000") ? 100 : 0;
}

function onExecuteAction(oParameter) {
	// oParameter will contain the parameters defined in Function Import
	// definition in SampleFunction.xsjs
	var sSalesOrderId = oParameter.SalesOrderId;

	// Implement your logic to get the TotalAmount based on sSalesOrderId
	var iTotalAmount = _getTotalAmount(sSalesOrderId);
   
	// Return an object that has properties matching the data definition
	// of the Function Import's return type
	return {
		TotalAmount: iTotalAmount
	};
}