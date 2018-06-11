"use strict";

$.import("custom", "type");

/**
 * Get the property definition of a Return Type in EDM format
 * @param {Object} oReturnTypeDefinition The Return Type definition object
 * @returns {string} The property definition in EDM format
 * @private
 */
function _getProperty(oReturnTypeDefinition) {
	var sMetadata = "";
	
	if (!oReturnTypeDefinition.hasOwnProperty("Property")) {
		return sMetadata;
	}
	
	if (oReturnTypeDefinition.Key) {
		var aKey = oReturnTypeDefinition.Key;
		aKey = (!Array.isArray(aKey)) ? [aKey] : aKey;
		
		sMetadata += "<Key>";
		
		for (var i in aKey) {
			sMetadata += "<PropertyRef Name=\"" + aKey[i] + "\"/>";
		}
		
		sMetadata += "</Key>";
		
	}

	var aProperty = oReturnTypeDefinition.Property;
	
	if (!Array.isArray(aProperty)) {
		aProperty = [aProperty];
	}
	
	for (i in aProperty) {
		switch (aProperty[i].Type) {
			case $.custom.type.DECIMAL:
				
				sMetadata += "<Property Name=\"" + aProperty[i].Name + "\"" 
					+ " Type=\"" + aProperty[i].Type + "\"" 
					+ " Precision=\"" + aProperty[i].Precision + "\""
					+ " Scale=\"" + aProperty[i].Scale + "\"/>";
				
				break;
			case $.custom.type.STRING:
				
				sMetadata += "<Property Name=\"" + aProperty[i].Name + "\""
					+ " Type=\"" + aProperty[i].Type + "\"" 
					+ " MaxLength=\"" + aProperty[i].MaxLength + "\"/>";
					
				break;
			default:
				break;
		}

	}
	
	return sMetadata;
}

/**
 * Get the Complex Type definition in EDM format
 * @param {Object} oDataModelDefinition The data model definition object
 * @returns {string} The complext type definition in EDM format
 * @private
 */
function _getComplexType(oDataModelDefinition) {
	var sMetadata = "";
	
	if (!oDataModelDefinition.hasOwnProperty("ComplexType")) {
		return sMetadata;
	}
	
	var aComplexType = oDataModelDefinition.ComplexType;
	
	if (!Array.isArray(aComplexType)) {
		aComplexType = [aComplexType];
	}
	
	for (var i in aComplexType) {
		sMetadata += "<ComplexType Name=\"" + aComplexType[i].Name + "\">"
			+ _getProperty(aComplexType[i])
			+ "</ComplexType>";
	}
	
	return sMetadata;
}

/**
 * Get the Entity Type definition in EDM format
 * @param {Object} oDataModelDefinition The data model definition object
 * @returns {string} The entity type definition in EDM format
 * @private
 */
function _getEntityType(oDataModelDefinition) {
	var sMetadata = "";
	
	if (!oDataModelDefinition.hasOwnProperty("EntityType")) {
		return sMetadata;
	}
	
	var aEntityType = oDataModelDefinition.EntityType;
	
	if (!Array.isArray(aEntityType)) {
		aEntityType = [aEntityType];
	}
	
	for (var i in aEntityType) {
		sMetadata += "<EntityType Name=\"" + aEntityType[i].Name + "\">"
			+ _getProperty(aEntityType[i])
			+ "</EntityType>";
	}
	
	return sMetadata;
}

/**
 * Get the parameter definition from a Function Import in EDM format
 * @param {Object} oFunctionImportDefinition The function import definition object
 * @returns {string} The parameter defintion of a Function Import in EDM format
 * @private
 */
function _getParameter(oFunctionImportDefinition) {
	var sMetadata = "";
	
	if (!oFunctionImportDefinition.hasOwnProperty("Parameter")) {
		return sMetadata;
	}
	
	var aParameter = oFunctionImportDefinition.Parameter;
	
	if (!Array.isArray(aParameter)) {
		aParameter = [aParameter];
	}
	
	for (var i in aParameter) {
		sMetadata += "<Parameter Name=\"" + aParameter[i].Name + "\""
			+ " Type=\"" + aParameter[i].Type + "\""
			+ " Mode=\"In\""
			+ " MaxLength=\"" + aParameter[i].MaxLength + "\"/>";
	}
	
	return sMetadata;
}

/**
 * Get the Function Import definition in EDM format
 * @param {Object} oDataModelDefinition The data model definition object
 * @returns {string} The function import definition in EDM format
 * @private
 */
function _getFunctionImport(oDataModelDefinition) {
	var sMetadata = "";
	
	if (!oDataModelDefinition.hasOwnProperty("FunctionImport")) {
		return sMetadata;
	}
	
	var aFunctionImport = oDataModelDefinition.FunctionImport;
	
	if (!Array.isArray(aFunctionImport)) {
		aFunctionImport = [aFunctionImport];
	}
	
	for (var i in aFunctionImport) {
		sMetadata += "<FunctionImport Name=\"" + aFunctionImport[i].Name + "\" ReturnType=\"default." + aFunctionImport[i].ReturnType + "\" m:HttpMethod=\"" + aFunctionImport[i].HttpMethod + "\">"
			+ _getParameter(aFunctionImport[i])
			+ "</FunctionImport>";
	}
	
	return sMetadata;
}

/**
 * Get the Metadata (EDMX) Definition for an OData Service
 * @param {Object} oDataModelDefinition The data model definition for an OData Service
 * @returns {string} The data model definition of an OData Service in EDM format
 * @public
 */
function getMetadata(oDataModelDefinition) {
	return "<edmx:Edmx xmlns:edmx=\"http://schemas.microsoft.com/ado/2007/06/edmx\" Version=\"1.0\">"
		+ "<edmx:DataServices xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" m:DataServiceVersion=\"2.0\">"
			+ "<Schema xmlns:d=\"http://schemas.microsoft.com/ado/2007/08/dataservices\" xmlns:m=\"http://schemas.microsoft.com/ado/2007/08/dataservices/metadata\" xmlns=\"http://schemas.microsoft.com/ado/2008/09/edm\" Namespace=\"default\">"
				+ _getComplexType(oDataModelDefinition)
				+ _getEntityType(oDataModelDefinition)
				+ "<EntityContainer Name=\"v2\" m:IsDefaultEntityContainer=\"true\">"
					+ _getFunctionImport(oDataModelDefinition)
				+ "</EntityContainer>"
			+ "</Schema>"
		+ "</edmx:DataServices>"
	+ "</edmx:Edmx>";
}
