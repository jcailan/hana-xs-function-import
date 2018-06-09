 "use strict";

/**
 * Converts the oError object into a JSON qualified format
 * @param {(object|Array)} oError The error object
 * @returns {(object|Array)} The formatted error object
 * @public
 */
function convertError(oError) {
	if (Array.isArray(oError)) {
		return oError;
	}

	return {
		type: oError.name,
		message: oError.message
	};
}
