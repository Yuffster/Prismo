(function() {

	/*
	 *
	 *
	 *  Super Alpha Build!
	 * (or: Don't trust libs named after children's cartoon charaters.)
	 *
	 *
	 */

	var config = {
		// These are the strings within templates we'll search for field
		// names (in order to build up dependencies).
		expression_match : /\{\{(.*?)\}\}/g,
		comment_match    : /^#/,
		// The template engine should have a .compile method which returns an
		// interface with a .render method.
		template_engine  : false,
		template_selector: 'script[type="text/logical"]'
	};

	Logical.config('expression_start', "{{");
	Logical.config('expression_end', '}}');

	function View(templateName, fields) {

		// We take an object of disparate things, add all the keynames to
		// fields[] (for messing about with templates), all the functions to 
		// transforms, and all the normal default values to defaults.
		// (Check out the prototype declaration below for more info.)
		for (var k in fields) {
			this.fields.push(k);
			if (typeof(fields[k])==="function") {
				this.transforms[k] = fields[k];
			} else {
				this.defaults[k] = fields[k];
			}
		}

		var templateString = document.querySelector(
			config.template_selector+'[name='+templateName+']'
		).innerHTML;

		this.templateTree = document.createElement('div');
		this.templateTree.innerHTML = templateString;
		this._walkTree(this.templateTree);

		// TODO: Check for the case in which there is no parent wrapper, in
		// which case we want to keep our arbitrary wrapper <div>.
		this.templateTree = this.templateTree.firstElementChild;

	}

	View.prototype = {
		// These variables get injected into the template.
		fields       : [],
		// Default values for fields.
		defaults     : {},
		// Transformation functions for field values.
		transforms   : {},
		// The uncompiled template in DOM form, with field dependencies marked.
		// (aka: the thing that makes Prismo shiny)
		templateTree : [],
		// Handy list of all attached views.
		views        : []
	};

	View.prototype._getFieldNames = function(string) {

		// JavaScript doesn't support back-referencing, so let's just
		// ignore everything in between quotes.
		string = string.replace(/"(.*?)[^\\]"/g, '');   // "
		string = string.replace(/'(.*?)[^\\]'/g, '');   // '

		// idk and comments I guess.
		string = string.replace(/\/\/(.*?)$/g, '');     // <--
		string = string.replace(/\/\*((.|[\r\n])*?)\*\//gm, ''); // comments.

		// This is a comment based on the syntax sugar for comments.
		if (string.match(config.comment_match)) return;

		// Now we'll find all the words left and check them against
		// our field names.  (We could also just check to see if they're
		//
		// We could also just check to see if the're in a list of reserved
		// JavaScript keywords, but I don't want to maintain that list, and
		// we're already presumably keeping track of our field names elsewhere,
		// so there's no file length overhead.

		var words   = string.match(/\b(\w+)\b/g),
		    matches = [];

		for (var i in words) {
			// If the word is in our field list and not in our 
			// matches list, add it.
			if (
				this.fields.indexOf(words[i]) != -1
				&& matches.indexOf(words[i]) == -1
			) {
				matches.push(words[i]);
			}
		}

		return (matches.length) ? matches : false;

	};

	View.prototype._compileNode = function(node) {

		var codeStrings = node.textContent.match(config.expression_match),
		    i, vars, fields = [], codeBlocks, f, n;

		if (node.textContent.match(config.expression_match)) {

			// Pull out all our code blocks and determine which field
			// names we need to worry about.

			codeBlocks = node.textContent.match(config.expression_match);

			for (i in codeBlocks) {
				f = this._getFieldNames(codeBlocks[i]);	
				if (f) {
					for (n in f) {
						if (fields.indexOf(f[n]) == -1) fields.push(f[n]);
					}
				}
			}

			var par = node.parentElement, // TODO: Shim.
			    cid = (
			    	     Math.floor(Math.random()*1000)
			    	   + new Date().getTime()
			    	  ).toString(16);

			par.setAttribute('data-bind', fields.join(' '));

			// TODO: Probably a better way to store this.
			par.setAttribute('data-componentid', cid);
			Logical.addTemplate(cid, par.innerHTML);

		}

	};

	View.prototype._rerender = function(el, data) {
		if (!el.getAttribute) return; // Womp womp.
		var cid = el.getAttribute('data-componentid');
		if (!cid) return; // Sad trombones.
		el.innerHTML = Logical.render(cid, data);
	};

	View.prototype._walkTree = function(el) {
		// Go through every child of the parent DOM node,
		// including TextContent nodes.
		var nodes = el.childNodes, node;

		for (var i=0;i<nodes.length;i++) {
			node = nodes[i];
			if (node.childNodes.length == 0) {
		 		this._compileNode(node);
			} else {
				this._walkTree(node);
			}
		}
		return el;
	};

	function AttachedView(view, selector, data) {
		this.view     = view;
		this.selector = selector;
		this.data     = {};

		var containers = document.body.querySelectorAll(selector),
		    clone;
		
		for (var i=0;i<containers.length;i++) {
			// Create a clone of the shadowDOM.
			clone = document.createElement('div');
			clone = this.view.templateTree.cloneNode(true);
			containers[i].innerHTML = '';
			containers[i].appendChild(clone);
		}

		return this;
	}

	AttachedView.prototype = {
		view: false,
		selector: '',
		data: {}
	};

	AttachedView.prototype._refreshField = function(key) {
		var containers = document.body.querySelectorAll(this.selector), 
		    deps, i, j;
		for (i=0;i<containers.length;i++) {
			deps = containers[i].querySelectorAll("[data-bind*="+key+"]");
			for (j=0;j<deps.length;j++) {
				this.view._rerender(deps[j], this.data);
			}
		}
	};

	AttachedView.prototype.set = function(obj) {

		var fields = [];			

		for (var k in obj) {
			if (this.view.transforms[k]) {
				this.data[k] = this.view.transforms[k].apply(this.data, [obj[k]]);
				fields.push(k);
			} else if (obj[k] != this.data[k]) {
				this.data[k] = obj[k];
				fields.push(k);
			}
		}

		for(var i in fields) this._refreshField(fields[i]);

	};

	View.prototype.attach = function(selector) {
		var view = new AttachedView(this, selector);
		this.views.push(view);
		return view;
	};

	function createView(templateName, fields) {
		var newView = new View(templateName, fields);
		return newView;
	}

	this.Prismo = {
		createView: createView
	};

}.call(this));