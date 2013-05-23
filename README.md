Metawidget/My Digital Structure Integration: Proof Of Concept
=============================================================

This project is a 'proof of concept' integration between Metawidget (http://metawidget.org) and My Digital Structure (http://mydigitalstructure.com). It uses Stylus and Uglify (via Grunt), AngularJS, Bootstrap (which needs JQuery) and Metawidget to dynamically (and generically) render entities by accessing the My Digital Structure REST APIs for both data and metadata.

Key features include:

* A single generic search page (partials/search.html) and a single generic CRUD page (partials/crud.html) for all entities
* Support for creating, retrieving, updating and deleting entities generically
* Support for related entities (via dropdowns) 