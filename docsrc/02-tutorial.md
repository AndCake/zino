---
layout: page
title: Tutorial
permalink: /tutorial
subpages:
  - 01:
    url: /pages/tutorial/01-first-component.html
    name: Your First Component
  - 02:
    url: /pages/tutorial/02-backend-communication.html
    name: Backend Communication
  - 03:
    url: /pages/tutorial/03-styling-components.html
    name: Styling Components
---

For this tutorial you will need a running server to serve your static files. You can use the Gruntfile from this repository and adapt it to your needs. Don't forget to take over
the dev dependencies from the package.json, though.

In this tutorial, we will be creating a simple comment component where you can see
all the comments that have been entered before, enter a new comment and functionality
to bind it to your backend.

Create your tutorial HTML file that looks like this:

	<!DOCTYPE html>
	<html>
		<head>
			<link rel="zino-tag" href="comment-box.html"/>
		</head>
		<body>
			<comment-box></comment-box>

			<script src="zino.js"></script>
		</body>
	</html>
