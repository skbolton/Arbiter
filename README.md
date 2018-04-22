# Arbiter

![npm](https://img.shields.io/npm/v/arbiter-salesforce.svg)[![Coverage Status](https://coveralls.io/repos/github/skbolton/Arbiter/badge.svg?branch=2.0)](https://coveralls.io/github/skbolton/Arbiter?branch=2.0)![Build](https://travis-ci.org/skbolton/Arbiter.svg?branch=2.0)

Arbiter is a <a href="https://www.salesforce.com/" target="_blank">Salesforce</a> ORM for <a href="https://nodejs.org" target="_blank">Nodejs</a> with the goal of making modeling and querying Salesforce as painless as possible. With powerful schemas for validation and field remappings, Arbiter is the perfect layer to have between you and Salesforce.

Arbiter is built on top of the popular <a href="https://jsforce.github.io/" target="_blank">JSforce</a> query library. People familiar with its api will feel right at home in Arbiter since most of the api is mirrored. Also, JSForce <a href="https://jsforce.github.io/document/#query" target="_blank">connection</a> objects are exposed providing escape hatches when needed, or an eased migration to Arbiter.

What you get with Arbiter:

* **A Declarative way of defining models and [associations](#associations) between them**
* **Extended query building API**. JSForce with more helpers
* **Field remappings.** No longer are you tied to your Salesforce field names. Create your own that are easier to reason about or matches your problem domain. __Or just to strip out those darn underscores...__
* [**Smart query results**](#grunts). Makes updating and creating new objects quick and easy
* **Optional field validation and defaults**

What Arbiter **doesn't** give you:

* **A way to modify Salesforce objects and schemas**. You will still need Salesforce devs to do that. The objects and relations have to be in place in order for Arbiter to query them.
* **Automatic loading of Salesforce schemas**. Arbiter schemas must be writen by hand. This means that you don't have to follow your Salesforce setup exactly and allows you to map fields to completely different names to align with your problem domain. This could be seen as a downside but hopefully after trying the library you will appreciate the flexibility.

Arbiter does everything it can to get you down the happy path of making queries and getting access to your Salesforce data. Many of the helpers and additions are to help handle edge that arise when querying nested relations from Salesforce.

Checkout the [documentation](https://skbolton.github.io/Arbiter)
