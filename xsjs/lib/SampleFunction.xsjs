"use strict";

$.import("custom", "type");
$.import("custom", "FunctionImportUtility");  

// Function Import Utility expects an importing parameter of type 
// Object (data definition object) which contains the data definition 
// for the function import and its return type
$.custom.FunctionImportUtility.execute({
	ComplexType: {
		Name: "TotalAmountType",
		Property: {
			Name: "TotalAmount",
			Type: $.custom.type.DECIMAL,
			Precision: "15",
			Scale: "0"
		}
	},
	
	FunctionImport: [{
		Name: "GetTotalAmount",
		// the return type is based on the complex type TotalAmountType
		ReturnType: "TotalAmountType",  
		HttpMethod: "GET",
		// the exit function implementation that is similar to the 
		// exit function in XSODATA framework
		ExitFunction: "xsjs:GetTotalAmount.xsjslib::onExecuteAction", 
		Parameter: [{
			Name: "SalesOrderId",
			Type: $.custom.type.STRING,
			MaxLength: "10"
		}]
	}]
});