# n8n-nodes-t0ggles

Official-looking n8n community node that connects n8n to the [t0ggles](https://t0ggles.com) tasks API.

## Requirements

- You must be an administrator of your t0ggles board.
- Generate an API key in your board by navigating to **Board Settings → Services → API Key**.

## Installation

Install the package in your n8n instance directory:

```
npm install n8n-nodes-t0ggles
```

## Credential Configuration

1. In n8n, go to **Credentials** and create new credentials of type **t0ggles API**.
2. Paste the API key you generated in t0ggles into the **API key** field.
3. Save the credential and test the connection.

## Using the Node

- Node name: **t0ggles**
- Resource: **Task**
- Operations:
  - **Get Many**: Retrieve tasks. Use the **Filters** collection to filter by project, status, assigned user, etc. For custom property filters, supply JSON in the `customPropertyFiltersJson` field, for example `{ "prop_Region": "North America" }`.
  - **Create**: Create one or more tasks. Required fields are title, project key, description type, and description content. Optional fields are available under **Additional Fields**. When setting `propertiesJson`, provide a JSON object that maps property names to their values, for example `{ "prop_StoryPoints": 5 }`.

After installation and configuration, the node will appear in your editor under **t0ggles**.

