( function() {

	'use strict';

	var module = angular.module( 'app', [ 'controllers', 'metawidget' ] );

	module.config( [ '$routeProvider', function( $routeProvider ) {

		$routeProvider.when( '/login', {
			templateUrl: 'partials/login.html',
			controller: 'loginController'
		} ).when( '/home', {
			templateUrl: 'partials/home.html',
			controller: 'homeController'
		} ).when( '/edit/:pathName/:methodName/:id', {
			templateUrl: 'partials/crud.html',
			controller: 'entityController'
		} ).when( '/new/:pathName/:methodName', {
			templateUrl: 'partials/crud.html',
			controller: 'entityController'
		} ).when( '/search/:pathName/:methodName', {
			templateUrl: 'partials/search.html',
			controller: 'entitiesController'
		} ).otherwise( {
			redirectTo: '/home'
		} );
	} ] );

	// Display progress bar during AJAX
	
	module.factory( 'visualHttp', [ '$http', '$rootScope', function( $http, $rootScope ) {

		$http.defaults.transformRequest.push( function( data ) {

			$rootScope.duringAjax = true;
			return data;
		} );
		$http.defaults.transformResponse.push( function( data ) {

			delete $rootScope.duringAjax;
			return data;
		} )
		
		return $http;
	} ] );
} )();