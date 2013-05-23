( function() {

	'use strict';

	var baseUrl = 'https://site1567.1blankspacebeta.com';

	/* Controllers */

	var module = angular.module( 'controllers', [] );

	/* Login */

	module.controller( 'loginController', [ '$rootScope', '$scope', 'visualHttp', '$location', function( $rootScope, $scope, visualHttp, $location ) {

		delete $rootScope.sid;

		$scope.metawidgetConfig = {
			addWidgetProcessors: [ new metawidget.bootstrap.widgetprocessor.BootstrapWidgetProcessor() ],
			layout: new metawidget.bootstrap.layout.BootstrapDivLayout()
		};

		$scope.login = {
			logon: "",
			password: "",
			signIn: function() {

				_httpJsonPost( visualHttp, baseUrl + '/rpc/logon/', $scope.login ).success( function( data ) {

					if ( data.error !== undefined ) {
						$scope.error = data.error.errornotes;
						console.log( $scope.error );
					} else {
						delete $scope.error;
						$rootScope.sid = data.sid;
						$location.path( '/home' );
					}

				} ).error( function( data ) {

					$scope.error = data;
				} );
			},
		};
	} ] );

	/* Home */
	
	module.controller( 'homeController', [ '$rootScope', '$location', function( $rootScope, $location ) {

		if ( $rootScope.sid === undefined ) {
			console.log( 'Not logged in' );
			$location.path( '/login' );
			return;
		}
	} ] );

	/* CRUD */

	module.controller( 'entitiesController', [
			'$rootScope',
			'$scope',
			'$routeParams',
			'visualHttp',
			'$location',
			function( $rootScope, $scope, $routeParams, visualHttp, $location ) {

				if ( $rootScope.sid === undefined ) {
					console.log( 'Not logged in' );
					$location.path( '/login' );
					return;
				}

				$scope.routeParams = {
					pathName: $routeParams.pathName,
					methodName: $routeParams.methodName
				};

				// Search

				$scope.search = function() {

					visualHttp.get( baseUrl + '/rpc/' + $routeParams.pathName + '/?method=' + $routeParams.methodName + '_SEARCH&sid=' + $rootScope.sid ).then( function( result ) {

						$scope.results = result.data.data.rows;
						console.log( 'Searched' );
					} );
				}

				$scope.search();

				// Show results

				var _myWidgetBuilder = new metawidget.widgetbuilder.HtmlWidgetBuilder();
				var _superAddColumn = _myWidgetBuilder.addColumn;
				_myWidgetBuilder.addColumn = function( tr, value, attributes ) {

					var td = _superAddColumn( tr, value, attributes );

					// Warp column contents with an anchor

					var anchor = document.createElement( 'a' );
					anchor.setAttribute( 'href', '#/edit/' + $routeParams.pathName + '/' + $routeParams.methodName + '/' + value.id );
					anchor.innerHTML = td.innerHTML;
					td.innerHTML = '';
					td.appendChild( anchor );
				}

				$scope.metawidgetConfig = {

					widgetBuilder: new metawidget.widgetbuilder.CompositeWidgetBuilder( [ new metawidget.widgetbuilder.OverriddenWidgetBuilder(), new metawidget.widgetbuilder.ReadOnlyWidgetBuilder(),
							_myWidgetBuilder ] ),
					addWidgetProcessors: [ new metawidget.bootstrap.widgetprocessor.BootstrapWidgetProcessor() ],
					layout: new metawidget.layout.SimpleLayout()
				}
			} ] );

	module.controller( 'entityController', [ '$rootScope', '$scope', '$routeParams', 'visualHttp', '$location', function( $rootScope, $scope, $routeParams, visualHttp, $location ) {

		if ( $rootScope.sid === undefined ) {
			console.log( 'Not logged in' );
			$location.path( '/login' );
			return;
		}

		$scope.routeParams = {
			pathName: $routeParams.pathName
		};

		if ( $routeParams.id === undefined ) {

			// Create

			$scope.current = {};

		} else {

			// Retrieve

			visualHttp.post( baseUrl + '/rpc/' + $routeParams.pathName + '/?method=' + $routeParams.methodName + '_SEARCH&sid=' + $rootScope.sid + '&advanced=1', {
				filters: [ {
					name: "id",
					comparison: "EQUAL_TO",
					value1: $routeParams.id
				} ],
				fields: [ {
					name: "*"
				} ]
			} ).then( function( result ) {

				$scope.current = {};

				for ( var propertyName in result.data.data.rows[0] ) {

					var name = propertyName;

					if ( name.lastIndexOf( '.' ) !== -1 ) {
						name = name.substr( name.lastIndexOf( '.' ) + 1 );
					}

					$scope.current[name] = result.data.data.rows[0][propertyName];
				}

				$scope.readOnly = true;
			} );
		}

		// Edit

		$scope.metawidgetConfig = {

			addInspectionResultProcessors: [ function( inspectionResult, mw, toInspect, type, names ) {

				// Fetch metadata

				if ( names === undefined ) {

					visualHttp.post( baseUrl + '/rpc/' + $routeParams.pathName + '/?method=' + $routeParams.methodName + '_SEARCH&advanced=1&sid=' + $rootScope.sid, {
						options: {
							rf: 'JSON',
							returnparameters: 'contactperson'
						}
					} ).then( function( result ) {

						var inspectionResult = {};
						inspectionResult.properties = {};

						// Convert it into JSON schema (http://json-schema.org)

						var allParameters = result.data.data.parameters;

						for ( var loop = 0, length = allParameters.length; loop < length; loop++ ) {

							var parametersBlock = allParameters[loop];

							// name

							var name = parametersBlock.name;

							// support 'foo.bar' convention

							if ( name.lastIndexOf( '.' ) !== -1 ) {
								name = name.substr( name.lastIndexOf( '.' ) + 1 );
							}

							// support '...text' convention

							if ( parametersBlock.inputtype === 'select' ) {
								name = name.substr( 0, name.lastIndexOf( 'text' ) );
							}

							var properties = inspectionResult.properties[name] || {};
							inspectionResult.properties[name] = properties;

							// propertyOrder

							properties.propertyOrder = loop;

							// type

							if ( parametersBlock.datatype === 'date' ) {
								properties.type = 'date';
							} else {
								properties.type = 'string';

								// Don't use type = 'number', because
								// mydigitalstructure returns number values as
								// strings
							}

							// needEnum (requires a second AJAX call)

							if ( parametersBlock.inputtype === 'select' ) {
								properties.needEnum = parametersBlock.searchmethod;
							}
						}

						// Lookup any enums

						_lookupEnums( inspectionResult );
					} );

					//
					// Private methods
					//

					/**
					 * Replace any 'needEnum' properties with the result of an
					 * asynchronous lookup.
					 */

					function _lookupEnums( inspectionResult ) {

						for ( var propertyName in inspectionResult.properties ) {

							var properties = inspectionResult.properties[propertyName];

							if ( properties.needEnum === undefined ) {
								continue;
							}

							console.log( propertyName + ' needs ' + properties.needEnum );

							visualHttp.get( baseUrl + '/ondemand/setup/?method=' + properties.needEnum + '&sid=' + $rootScope.sid, {} ).then( function( result ) {

								delete properties.needEnum;

								var enum = [];
								var enumTitles = [];

								if ( result.data.data ) {

									for ( var loop = 0, length = result.data.data.rows.length; loop < length; loop++ ) {
										enum.push( result.data.data.rows[loop].id );
										enumTitles.push( result.data.data.rows[loop].title );
									}
								}

								properties.enum = enum;
								properties.enumTitles = enumTitles;
								_lookupEnums( inspectionResult );
							} );

							// Defer to async call

							return;
						}

						// Finally, render the Metawidget

						console.log( 'Retrieved metadata' );
						mw.buildWidgets( inspectionResult );
					}
				}

				return;
			} ],
			addWidgetProcessors: [ new metawidget.bootstrap.widgetprocessor.BootstrapWidgetProcessor() ],
			layout: new metawidget.bootstrap.layout.BootstrapDivLayout()
		};

		// Save/Delete

		$scope.actions = {

			edit: function() {

				$scope.readOnly = false;
			},

			save: function() {

				visualHttp.post( baseUrl + '/rpc/' + $routeParams.pathName + '/?method=' + $routeParams.methodName + '_MANAGE&sid=' + $rootScope.sid, $scope.current ).then( function( result ) {

					if ( result.data.error !== undefined ) {
						$scope.error = result.data.error.errornotes;
					} else {
						delete $scope.error;
						$scope.current.id = result.data.id;
						console.log( result.data.notes + " with id " + $scope.current.id );
						$location.path( '/search/' + $routeParams.pathName + '/' + $routeParams.methodName );
					}
				} );
			},

			"delete": function() {

				visualHttp.post( baseUrl + '/rpc/' + $routeParams.pathName + '/?method=' + $routeParams.methodName + '_MANAGE&sid=' + $rootScope.sid, {
					id: $scope.current.id,
					remove: 1
				} ).then( function( result ) {

					console.log( result.data.notes + " id " + $scope.current.id );
				} );

				$location.path( '/search/' + $routeParams.pathName + '/' + $routeParams.methodName );
			},

			cancel: function() {

				$location.path( '/search/' + $routeParams.pathName + '/' + $routeParams.methodName );
			}
		}

		$scope.metawidgetActionsConfig = {

			inspector: new metawidget.inspector.CompositeInspector( [ new metawidget.inspector.PropertyTypeInspector(), function() {

				return {
					properties: {
						edit: {
							hidden: "{{!readOnly}}"
						},
						save: {
							hidden: "{{readOnly}}"
						},
						"delete": {
							hidden: "{{readOnly || !current.id}}"
						}
					}
				};
			} ] ),
			addWidgetProcessors: [ new metawidget.bootstrap.widgetprocessor.BootstrapWidgetProcessor() ],
			layout: new metawidget.layout.SimpleLayout()
		}
	} ] );

	//
	// Private methods
	//

	function _httpJsonPost( http, theUrl, theData ) {

		return http( {
			method: 'POST',
			url: theUrl,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			// Hacked until /ondemand supports JSON requests
			transformRequest: function( obj ) {

				var str = [];
				for ( var p in obj ) {
					if ( typeof ( obj[p] ) !== 'string' ) {
						continue;
					}
					str.push( encodeURIComponent( p ) + "=" + encodeURIComponent( obj[p] ) );
				}
				return str.join( "&" );
			},
			data: theData
		} );
	}
} )();
