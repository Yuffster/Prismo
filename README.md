# {{= Prismo's Artisinal Templates }}

Prismo is a super simple, dynamic front-end view engine built on top of [Logical.js](https://github.com/Yuffster/logical).

Because it's based on Logical, you get sandboxed templates, meaning you can use the full JavaScript language (plus syntax sugar) without worrying about mixing application logic and template logic.  You can even add helpers to make common template tasks easier!

Afterwards, Prismo works its magic to search through all of your templates and automatically compose your front-end views based on the variables within the templates.  When data is updated, *only the part of the view which relies on that data* is re-rendered.

At the moment, Prismo is an **early alpha** proof-of-concept, which means you should try it, and if you like it, show it some love with a fork or a star!  Provide feedback about how you'd like to use it, and we'll work on congifuration values which follow your ideal workflow.

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
		Hello, my name is {{= name }}, and my favorite food is {{= food}}!
	</p>
	
	<p>
		My count has been updated 
		<span data-bind="count" data-component-id="14ce1eb788">
			{{= count }}
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