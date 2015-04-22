# {{= Prismo's Artisinal Templates }}

Prismo is a super simple, dynamic front-end view engine built on top of [Logical.js](https://github.com/Yuffster/logical).

Because it's based on Logical, you get sandboxed templates, meaning you can use the full JavaScript language (plus syntax sugar) without worrying about mixing application logic and template logic.  You can even add helpers to make common template tasks easier!

Afterwards, Prismo works its magic to search through all of your templates and automatically compose your front-end views based on the variables within the templates.  When data is updated, *only the part of the view which relies on that data* is re-rendered.

At the moment, Prismo is an **early alpha** proof-of-concept, which means you should try it, and if you like it, show it some love with a fork or a star!  Provide feedback about how you'd like to use it, and we'll work on congifuration values which follow your ideal workflow.

## What Does Prismo Do?

Let's say you have a view like this:

```html
<div class="user">
	
	<p>
		Hello, my name is {{= name }}, and my favorite food is {{= food}}!
	</p>
	
	<p>
		My count has been updated 
		<span>
			{{= count }}
		</span>
		times!
	</p>

</div>
```

Prismo takes data you've bound to this view and encases it in template fragments which reflect the variable dependencies of the template.

In other words, it takes the HTML above and expands it to something like:

```html
<div class="user">
	
	<p data-bind="name food" data-component-id="14ce1eb788">
		Hello, my name is Prismo, and my favorite food is pickles!
	</p>
	
	<p>
		My count has been updated 
		<span data-bind="count" data-component-id="14ce1eb756">
			0
		</span> times!
	</p>

</div>
```

If you change the value of name or food, only the first `<p>` element is re-rendered.  If you change the value of `count`, only the span containing the count is re-rendered.

To change how things are re-rendered, simply change the semantic structure of your HTML.  (In most View engines, this would take a significant amount more refactoring.)

## Example Usage

For now, Prismo is hard-coded to find templates embedded in the HTML document as script tags using a type of "text/logical" to distinguish it from normal JavaScript.

So, let's say you have a template called userTemplate:

```html
<script type="text/logical" name="userTemplate">

	<div class="user">

		<p>
			Hello! 
		</p>
		<p>

			{{ if (name): }}
				My name is {{= name }}
			{{ else: }}
				I have no name
			{{ end }} 

			and 

			{{ if (food): }}
				my favorite food is {{= food }}.
			{{ else: }}
				I don't like food.
			{{ end }}
		</p>


		<p>
			{{ if (food): }}
				{{= food }} are my favorite food because they're delicious.
			{{ end }}
		</p>

		<p>
			The sum of all counts is
			<span class="counter">
				"{{= count }}"
			</span>
			so far.
		</p>

	</div>

</script>
```

To create a new view, we use `Prismo.createView`, and pass it a name and a set of field names and default properties.

```javascript
UserView = Prismo.createView('userTemplate', {
	name:'',
	food:''
});
```

You've just created a new View!  You can now attach that view to a DOM node.  This will render the template within that node.

```javascript
prismo = UserView.attach('#user1 .container')
```

Now we can set data on the view, and have the view update automatically!

```javascript
prismo.set({ name: 'Prismo', food: 'pickles' });
```

### Transformation Methods

Instead of simple default values, we can also pass transformation methods to our view layer.  Incoming data will be run through the method we provide instead of being sent directly to the template for rendering.

This is super useful for data verification and complex behaviors.

A simple example usage for a transformation method would be to provide a counter variable.

```javascript
UserView = Prismo.createView('userTemplate', {
	// [...]
	count: function(val) {
		return (this.count || 0)+val;
	}
});
```

In this case, when you run:

```javascript
prismo.set({ count: 1 }); // Will update count to 1.
prismo.set({ count: 5 }); // Will update count to 6.
prismo.set({ count: 4 }); // Will update count to 10.
```

You're actually sending the values to the count method.

Notice that the count method has access to a copy of all the variables currently set within the template.

## Complete API Documentation

### Prismo

Prismo is the main API wrapper.

#### Prismo.config(key, value)

The config method changes the default configuration of how Prismo finds and renders views.

##### Arguments

- **key** (string): A string representing the key of the config value you'd like to change.
- **value** (mixed): The new value.

##### Current config values

* **expression_match** (regex): A regular expression which will return logical template fragments.  Defaults to `/\{\{(.*?)\}\}/g`.

* **comment_match** (regex): A regular expression containing which expression blocks to ignore.  Defaults to `/^#/`.

* **template_engine** (object): An alternative template engine to Logical.  Must mimick the Logical API syntax.  Defaults to Logical.

* **template_selector** (string): the CSS selector to find template fragments within the DOM (which will also be appended with a name attribute).  Defaults to `script[type="text/logical"]`.

#### Prismo.createView

Creates a View handler based on given parameters.  The new View is returned.

##### Arguments

* **template_name** (string): The name of the template.  Will be appended to the template_selector config value in the form of a name attribute.
* **fields** (object): An object containing the fields required to render the template, along with default values or optional transformation methods. See the section of this document entitled [Transformation Methods](#transformation-methods) for more information.

#### View.attach

Attaches the View to a new DOM node and returns a new AttachedView instance.

##### Arguments

* **node**: A DOM node.  This node will be emptied and the rendered template will replace it.

#### AttachedView.set

The set method takes, alternatively, a key/value pair or an object containing all data to be reset.

* **key** (string): The field name for the data to be set.
* **value** (mixed): The value to be set.

## Pending Features

Prismo is only half complete.  The point is to dynamically compose views, which isn't happening at the moment, because it doesn't support lists or recursive data structures.

If you're interested in seeing what that would look like, forking or starring this project is a great way to let me know.  Otherwise, it'll stay on the back burner for a while.

Also, no real work has been done for cross-browser compatibility issues, and there's a lot of low-level node traversal that will break in lots of browsers.