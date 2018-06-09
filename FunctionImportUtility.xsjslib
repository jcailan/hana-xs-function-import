"use strict";

$.import("sample.edm", "type");
$.import("sample.core", "MessageUtility");  
$.import("sample.core", "MetadataGenerator");  

var MessageUtility = $.sample.core.MessageUtility;
var MetadataGenerator = $.sample.core.MetadataGenerator;

/**
 * Get the Function Import Definitions
 * @param {Object} oDataModelDefinition The data model definition configuration
 * @returns {Array} An array the contains Function Import Definitions
 * @private
 */
function _getFunctionImport(oDataModelDefinition) {
	var aFunctionImport = [];
	
	if (!oDataModelDefinition.hasOwnProperty("FunctionImport")) {
		return aFunctionImport;
	}
	
	aFunctionImport = oDataModelDefinition.FunctionImport;
	
	if (!Array.isArray(aFunctionImport)) {
		aFunctionImport = [aFunctionImport];
	}
	
	return aFunctionImport;
}

/**
 * Get the parameters from HTTP request
 * @param {Object} oFunctionImport The function import definition object
 * @returns {Object} The extracted parameters from an HTTP request
 * @private
 */
function _getParameter(oFunctionImport) {
	var oParameter = {};
	
	if (!oFunctionImport.hasOwnProperty("Parameter")) {
		return oParameter;
	}
	
	var aParameter = oFunctionImport.Parameter;
	
	if (!Array.isArray(aParameter)) {
		aParameter = [aParameter];
	}
	
	for (var i in aParameter) {
		var oValue = $.request.parameters.get(aParameter[i].Name);
		
		if (oValue === undefined) {
			throw new Error("Invalid Function Import Parameter");
		}
		
		if (aParameter[i].Type === $.sample.edm.type.STRING) {
			if (oValue.indexOf("'") === 0 && oValue.lastIndexOf("'") === (oValue.length - 1)) {
				oValue = oValue.replace(/\'/g, "");
			} else {
				throw new Error("Invalid value for parameter " + aParameter[i].Name);
			}
		}
		
		oParameter[aParameter[i].Name] = oValue;
	}
	
	return oParameter;
}

/**
 * Get the error response by using the oError object
 * @param {Object} oError The error object containing error messages
 * @returns {Object} The prepared Error Response object
 * @private
 */
function _getErrorResponse(oError) {
	return {
		body: {
			error: $.net.http.BAD_REQUEST,
			message: {
				lang: $.session.language,
				value: "Bad Request"
			},
			innererror: MessageUtility.convertError(oError)
		}, 
		status: $.net.http.BAD_REQUEST
	};
}

/**
 * Get the properties from a given return type name
 * @param {string} sReturnTypeName The return type name
 * @param {Object} oDataModelDefinition The data model definition object
 * @returns {Array} An array of property object definition
 * @private
 */
function _getReturnTypeProperty(sReturnTypeName, oDataModelDefinition) {
	var aReturnTypeProperty = [];
	
	var aComplexType = oDataModelDefinition.ComplexType;
	
	if (!Array.isArray(aComplexType)) {
		aComplexType = [aComplexType];
	}
	
	var aEntityType = oDataModelDefinition.EntityType;
	
	if (!Array.isArray(aEntityType)) {
		aEntityType = [aEntityType];
	}
	
	var aReturnType = aComplexType.concat(aEntityType);
	
	aReturnType = aReturnType.filter(function(oItem) {
		//remove if it is undefined
		if (!oItem) {return false;}
		
		return oItem.Name === sReturnTypeName;
	});

	if (aReturnType.length !== 1) {
		return aReturnTypeProperty;
	}
	
	if (!aReturnType[0].hasOwnProperty("Property")) {
		return aReturnTypeProperty;
	}
	
	var aProperty = aReturnType[0].Property;
	
	if (!Array.isArray(aProperty)) {
		aProperty = [aProperty];
	}
	
	return aProperty;
}

/**
 * Get the OData Response that is compliant with OData version 2 specifications
 * @param {Object} oResult The result of function import operation
 * @param {Object} oFunctionImport The function import definition object
 * @param {Object} oDataModelDefinition The data model definition object
 * @returns {Object} The prepared OData Response
 * @private
 */
function _getOdataResponse(oResult, oFunctionImport, oDataModelDefinition) {
	var aReturnTypeProperty = _getReturnTypeProperty(oFunctionImport.ReturnType, oDataModelDefinition);
	var oResponse = {
		"d": {}
	};
	
	var oData = {
		"__metadata": {
			"type": "default." + oFunctionImport.ReturnType
		}
	};

	for (var i in aReturnTypeProperty) {
		oData[aReturnTypeProperty[i].Name] = oResult[aReturnTypeProperty[i].Name];
	}
	
	oResponse.d[oFunctionImport.Name] = oData;
	
	return oResponse;
}

/**
 * Execute the Exit Function provided by the calling class
 * @param {string} sExitFunction The exit function that includes the directory path and XSJS Library file name where the exit function is implemented
 * @param {Object} oParameter The function import parameter object that will be used as an argument to be passed to the exit function
 * @returns {Object} The resulting object after executing the exit function
 * @private
 */
function _executeExitFunction(sExitFunction, oParameter) {
	var aExitFunction = sExitFunction.split("::");
	var sFunctionName = aExitFunction[1];
	var sFullFilePath = aExitFunction[0].split(".")[0];
	var aFilePath = sFullFilePath.split(":");
	var sFileName = aFilePath[aFilePath.length - 1];
	var sFilePath = "";
	
	for (var i=0; i < (aFilePath.length - 1); i++) {
		if (sFilePath !== "") {
			sFilePath += ".";
		}
		sFilePath += aFilePath[i];
	}
	
	$.import(sFilePath, sFileName);
	var oExitFunction;
	
	for (i in aFilePath) {
		if (oExitFunction === undefined) {
			oExitFunction = $[aFilePath[i]];
		} else {
			oExitFunction = oExitFunction[aFilePath[i]];
		}
	}
	
	if (typeof oExitFunction[sFunctionName] !== "function") {
		throw new Error(sFunctionName + " is not a valid function!");
	}

	return oExitFunction[sFunctionName](oParameter);
}

/**
 * The main processor of this Function Import Utility
 * @param {Object} oDataModelDefinition The data model definition/configuration for an OData Service
 * @public
 */
function execute(oDataModelDefinition) {
	if ($.request.queryPath === "$metadata") {
		$.response.contentType = "application/xml";
		$.response.setBody(MetadataGenerator.getMetadata(oDataModelDefinition));
		$.response.status = $.net.http.OK;
		return;
	}
	
	var oResponse;
	var aFunctionImport = _getFunctionImport(oDataModelDefinition);
	var aSelectedFunctionImport = aFunctionImport.filter(function(oItem) {
		return oItem.Name === $.request.queryPath;
	});

	if (aSelectedFunctionImport.length === 1) {
		try {
			var oParameter = _getParameter(aSelectedFunctionImport[0]);
			var oResult = _executeExitFunction(aSelectedFunctionImport[0].ExitFunction, oParameter);
			oResponse = {
				body: _getOdataResponse(oResult, aSelectedFunctionImport[0], oDataModelDefinition),
				status: $.net.http.OK
			};
		} catch (oError) {
			oResponse = _getErrorResponse(oError);
		}
	} else {
		oResponse = _getErrorResponse(new Error("Resource not found for the segment '" + $.request.queryPath + "'."));
	}
	
	$.response.contentType = "application/json";
	$.response.setBody(oResponse.body);
	$.response.status = oResponse.status;
}
