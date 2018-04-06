# Arbiter-Salesforce
![npm](https://img.shields.io/npm/v/arbiter-salesforce.svg)

Arbiter is a [Salesforce](https://www.salesforce.com/) ORM for [Node.js](https://nodejs.org) with the goal of making modeling and querying Salesforce as painless as possible. With powerful schemas for validation and field remapping, Arbiter is the perfect layer to have between you and Salesforce.

Arbiter is built on the popular query library [JSforce](https://jsforce.github.io/). People familiar with its api will feel right at home as most of their api is mirrored in Arbiter. Also, Arbiter exposes jsforce connection objects providing an escape hatches when needed, or an eased migration to Arbiter.

What Arbiter gives you:
* **A Declarative way of defining models and relations between them**
* **Extended query building API**.
* **Field remappings.** No longer are you tied to your Salesforce field names. Create your own that are easier to reason about or matches your problem domain
* **Smart query results to make updating and creating new objects quick and easy**
* **Optional field validation**

What Arbiter **doesn't** give you:
* **A way to modify Salesforce objects and schemas**. You will still need Salesforce devs to do that. The objects and relations have to be in place in order for Arbiter to query them.
* **Automatic loading of Salesforce schemas**. Arbiter schemas must be writen by hand. This means that you don't have to follow your Salesforce setup exactly and allows you to map fields to completely different names to align with your problem domain. This could be seen as a downside but hopefully after trying the library you will appreciate the flexibility.

Arbiter does everything it can to get you down the happy path of making queries and getting access to your Salesforce data. Many of the helpers and additions are to help handle edge cases and issues that come up when querying nested relations from Salesforce.

# Documentation
* [Getting Started](docs/getting-started.md) - To the point example of how to use Arbiter
* [Schemas](docs/schemas.md) - Mappings and field definitions
* [Models](docs/models.md) - Create relations to other models and kick off queries
* [Queries](docs/queries.md) - Easy query building to get exactly the data you need
* [Grunts](docs/grunts.md) - Smart query results that allow updates and validation
* [Connection](docs/connection.md) - Manage connection to Salesforce

