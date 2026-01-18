API
You can programmatically fetch, create, and update tasks on a t0ggles board using the API. This feature is available exclusively to board owners and requires an API key that can be generated in the board settings.

Generate API Key
Get Tasks
Add Tasks
Update Tasks
Get Dependencies
Add Dependency
Delete Dependency
#
Generate API Key
Only board owners can generate API keys.

Open your board and go to Board Settings → Services.

Under API Key, click the Generate API Key button.

Generate API Key

Copy the generated key and store it somewhere safe - this is the only time you will see the full token.

Generate API Key

On future visits, only a masked portion of the key will be visible.

Generate API Key

#
Get Tasks
Use the following endpoint to get tasks:

GET https://t0ggles.com/api/v1/tasks
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Query Parameters
All query parameters are optional and can be combined to filter tasks.

#
Basic Parameters
Parameter	Description
projectKey	Filter by project key(s). Use comma-separated values for multiple projects (e.g., SWIPER,MARKETING,OTHER)
status	Filter by status name(s). Use comma-separated values for multiple statuses (e.g., To Do,In Progress)
descriptionType	Format for task description in response. One of: text, markdown, html. Default: text
assignedUserEmail	Filter by assigned user email(s). Use comma-separated values for multiple users (e.g., user1@email.com,user2@email.com)
priority	Filter by priority. One of: low, medium, high
pinToTop	Filter pinned tasks. One of: true, false
tag	Filter by tag name(s). Use comma-separated values for multiple tags (e.g., Urgent,Bug)
startDate	Filter by start date. Single date (2025-03-15) or date range (2025-03-15,2025-03-20)
dueDate	Filter by due date. Single date (2025-03-25) or date range (2025-03-15,2025-03-25)
#
Custom Properties
You can filter by custom properties using the prop_ prefix followed by the property name:

Parameter	Type	Description
prop_<PropertyName>	string	Filter by custom property value. Use comma-separated values for multiple options (e.g., prop_Region=North America,Europe)
Property Type Support:

Text: Exact match (comma-separated for multiple values)
Number: Numeric match (comma-separated for multiple values)
Date: Single date or date range (same format as startDate/dueDate)
Email: Exact match (comma-separated for multiple values)
URL: Exact match (comma-separated for multiple values)
Checkbox: Boolean value (true or false)
Toggle: Boolean value (true or false)
Select: Option value match (comma-separated for multiple values)
Multi-Select: Matches if task has any of the specified values
Person: Email match (comma-separated for multiple emails)
#
Response
The response includes an array of tasks matching the filter criteria (limited to 100 tasks):

Field	Type	Description
success	boolean	Indicates success
tasks	array	Array of task objects matching filter criteria
error	boolean	Indicates error (if any)
message	string	Error message (if error is true)
#
Task Object
Field	Type	Description
id	string	Task ID
parentId	string	Parent task ID (empty if no parent)
projectKey	string	Project key (e.g., MARKETING)
key	number	Task key (e.g., 123)
title	string	Task title
description	string	Task description (formatted based on descriptionType)
coverImageUrl	string	Cover image URL (empty if no image)
assignedUserEmail	string	Assigned user email (empty if unassigned)
startDate	string	Start date
dueDate	string	Due date
status	string	Status name
tags	string[]	Array of tag names
pinToTop	boolean	Whether task is pinned to top
priority	string	Priority (low, medium, high, or empty)
createdAt	string	Creation timestamp
createdBy	string	Creator email
updatedAt	string	Last update timestamp
updatedBy	string	Last updater email
startedAt	string	When task was started
startedBy	string	Who started the task
endedAt	string	When task was completed
endedBy	string	Who completed the task
properties	object	Custom properties as key-value pairs
#
Example
// Fetch tasks from MARKETING project with high priority
const res = await fetch(
  'https://t0ggles.com/api/v1/tasks?projectKey=MARKETING&priority=high&descriptionType=markdown',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_API_KEY',
    },
  }
);

const data = await res.json();
console.log(data);
/*
{
  success: true,
  tasks: [
    {
      id: "task123",
      parentId: "",
      projectKey: "MARKETING",
      key: 45,
      title: "Launch Campaign Planning",
      description: "## Campaign Details\n\nPlan and execute...",
      coverImageUrl: "",
      assignedUserEmail: "julia@company.com",
      startDate: "2025-03-15T18:00:00.00Z",
      dueDate: "2025-03-25T18:00:00.00Z",
      status: "In Progress",
      tags: ["Urgent", "Campaign"],
      pinToTop: true,
      priority: "high",
      createdAt: "2025-03-10T10:00:00Z",
      createdBy: "owner@company.com",
      updatedAt: "2025-03-12T15:30:00Z",
      updatedBy: "julia@company.com",
      startedAt: "2025-03-11T09:00:00Z",
      startedBy: "julia@company.com",
      endedAt: "",
      endedBy: "",
      properties: {
        "Campaign Type": "Product Launch",
        "Estimated Budget": 8000,
        "Region": "North America"
      }
    }
  ]
}
*/
// Fetch tasks with multiple filters including custom properties
const res = await fetch(
  'https://t0ggles.com/api/v1/tasks?' +
  'projectKey=SWIPER,MARKETING&' +
  'status=In Progress,Review&' +
  'assignedUserEmail=julia@company.com&' +
  'tag=Urgent&' +
  'dueDate=2025-03-15,2025-03-31&' +
  'prop_Region=North America&' +
  'descriptionType=html',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_API_KEY',
    },
  }
);

const data = await res.json();
console.log(data.tasks);
#
Add Tasks
Use the following endpoint to create tasks:

POST https://t0ggles.com/api/v1/tasks
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Payload
The tasks parameter is an array of task objects. Each object supports the following fields:

#
Required fields
Field	Type	Description
title	string	Task title
projectKey	string	Project key (e.g. SWIPER, OTHER)
descriptionType	string	One of: markdown, html, text
descriptionContent	string	Task description
#
Optional fields
Field	Type	Description
status	string	Status name (e.g. To Do, In Progress, Done)
assignedUserEmail	string	Email of the board member
priority	string	One of: low, medium, high
pinToTop	boolean	Whether to pin the task to the top
tags	array	Array of tag names
startDate, dueDate	date	JS Date object or ISO date string
properties	object	Map of property names to values
subtasks	array	Array of subtask objects in the same format as the main task
#
Response
Field	Type	Description
success	boolean	Indicates success
error	boolean	Indicates error (if any)
message	string	Error message (if error is true)
#
Example
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        title: 'Launch Campaign Planning',
        projectKey: 'MARKETING',
        assignedUserEmail: 'julia@company.com',
        priority: 'high',
        pinToTop: true,
        tags: ['Urgent', 'Campaign'],
        startDate: new Date(2025, 3, 15),
        dueDate: new Date(2025, 3, 25),
        descriptionType: 'markdown',
        descriptionContent: `
          ## Launch Campaign Timeline

          Tasks to complete before product launch:

          - Finalize creatives and copy
          - Schedule posts on all platforms
          - Coordinate with influencers

          **Due Date:** March 20

          Contact: [Julia](mailto:julia@company.com)
        `,
        properties: {
          // text type property
          'Campaign Type': 'Product Launch',
          // number type property
          'Estimated Budget': 8000,
          // checkbox type property
          'Assets Ready': false,
          // toggle type property
          'Approval Needed': true,
          // date type property
          'Kickoff Date': new Date(2025, 3, 15),
          // url type property
          'Landing Page URL': 'https://company.com/launch',
          // email type property
          'Marketing Lead': 'julia@company.com',
          // person type property
          'Stakeholder': 'pm@company.com',
          // select type property
          'Region': 'North America',
          // multi-select type property
          'Channels': ['Instagram', 'LinkedIn'],
        },
        subtasks: [
          {
            title: 'Finalize creatives and copy',
            projectKey: 'MARKETING',
            descriptionType: 'markdown',
            descriptionContent: `
              ## Finalize creatives and copy

              - Create social media posts
              - Design email newsletter
              - Prepare video content
            `,
          },
        ],
      },
    ],
  }),
});

// { success: true } or { error: true, message: 'error message' }
console.log(await res.json());
#
Update Tasks
Use the following endpoint to update existing tasks:

PUT https://t0ggles.com/api/v1/tasks
or

PATCH https://t0ggles.com/api/v1/tasks
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Payload
The tasks parameter is an array of task update objects. Each object must include a task identifier and the fields to update.

#
Task Identification (required - one of the following)
Field	Type	Description
id	string	Task ID
projectKey	string	Project key (e.g., MARKETING) - use with key
key	number	Task key number (e.g., 45) - use with projectKey
You can identify a task either by its id or by the combination of projectKey and key (e.g., MARKETING-45).

#
Updateable Fields (all optional)
Field	Type	Description
title	string	Task title
descriptionType	string	One of: markdown, html, text (requires descriptionContent)
descriptionContent	string	Task description (requires descriptionType)
status	string	Status name (e.g., To Do, In Progress, Done)
assignedUserEmail	string	Email of the board member (empty string to unassign)
priority	string	One of: low, medium, high, or empty string to clear
pinToTop	boolean	Whether to pin the task to the top
tags	array	Array of tag names (replaces existing tags)
startDate	string	ISO date string or empty string to clear
dueDate	string	ISO date string or empty string to clear
properties	object	Map of property names to values (merged with existing properties)
#
Parent Task Fields (optional)
You can make a task a subtask or unlink it from its parent:

Field	Type	Description
parentId	string	Parent task ID (empty string to unlink from parent)
parentProjectKey	string	Parent task project key - use with parentKey
parentKey	number	Parent task key number - use with parentProjectKey
#
Response
Field	Type	Description
success	boolean	Indicates success
tasks	array	Array of updated task info (id, key, url)
error	boolean	Indicates error (if any)
message	string	Error message (if error is true)
#
Examples
#
Update task by ID
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        id: 'task123',
        title: 'Updated Task Title',
        status: 'Done',
        priority: 'high',
      },
    ],
  }),
});

const data = await res.json();
console.log(data);
/*
{
  success: true,
  tasks: [
    {
      id: "task123",
      projectKey: "MARKETING",
      key: 45,
      title: "Updated Task Title",
      url: "https://t0ggles.com/my-board/MARKETING-45"
    }
  ]
}
*/
#
Update task by projectKey + key
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        projectKey: 'MARKETING',
        key: 45,
        assignedUserEmail: 'julia@company.com',
        tags: ['Urgent', 'Campaign'],
        dueDate: '2025-04-15',
      },
    ],
  }),
});

console.log(await res.json());
#
Make a task a subtask
// Using parent task ID
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        projectKey: 'MARKETING',
        key: 46,
        parentId: 'parentTask123',
      },
    ],
  }),
});

// Or using parent projectKey + key
const res2 = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        projectKey: 'MARKETING',
        key: 46,
        parentProjectKey: 'MARKETING',
        parentKey: 45,
      },
    ],
  }),
});
#
Unlink task from parent
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        id: 'subtask123',
        parentId: '', // Empty string unlinks from parent
      },
    ],
  }),
});
#
Update multiple tasks at once
const res = await fetch('https://t0ggles.com/api/v1/tasks', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    tasks: [
      {
        projectKey: 'MARKETING',
        key: 45,
        status: 'Done',
      },
      {
        projectKey: 'MARKETING',
        key: 46,
        status: 'In Progress',
        assignedUserEmail: 'alex@company.com',
      },
      {
        id: 'task789',
        priority: 'high',
        pinToTop: true,
      },
    ],
  }),
});
#
Get Dependencies
Use the following endpoint to get task dependencies:

GET https://t0ggles.com/api/v1/dependencies
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Query Parameters
All query parameters are optional and can be used to filter dependencies by task.

Parameter	Description
taskId	Filter by task ID (returns dependencies where task is predecessor or successor)
taskKey	Task key number (e.g., 45) - use with taskProjectKey
taskProjectKey	Project key (e.g., MARKETING) - use with taskKey
You can filter by task either using taskId or the combination of taskKey and taskProjectKey.

#
Response
Field	Type	Description
success	boolean	Indicates success
dependencies	array	Array of dependency objects
error	boolean	Indicates error (if any)
message	string	Error message (if error is true)
#
Dependency Object
Field	Type	Description
id	string	Dependency ID
predecessorId	string	Predecessor task ID
predecessorKey	number	Predecessor task key (e.g., 45)
predecessorProjectKey	string	Predecessor project key (e.g., MARKETING)
predecessorTitle	string	Predecessor task title
predecessorUrl	string	URL to predecessor task
successorId	string	Successor task ID
successorKey	number	Successor task key (e.g., 46)
successorProjectKey	string	Successor project key (e.g., MARKETING)
successorTitle	string	Successor task title
successorUrl	string	URL to successor task
lagDays	number	Days gap between predecessor end and successor start
createdAt	string	Creation timestamp
#
Example
// Get all dependencies for the board
const res = await fetch('https://t0ggles.com/api/v1/dependencies', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
});

const data = await res.json();
console.log(data);
/*
{
  success: true,
  dependencies: [
    {
      id: "dep123",
      predecessorId: "task123",
      predecessorKey: 45,
      predecessorProjectKey: "MARKETING",
      predecessorTitle: "Design mockups",
      predecessorUrl: "https://t0ggles.com/my-board/marketing-45",
      successorId: "task456",
      successorKey: 46,
      successorProjectKey: "MARKETING",
      successorTitle: "Implement design",
      successorUrl: "https://t0ggles.com/my-board/marketing-46",
      lagDays: 0,
      createdAt: "2025-03-10T10:00:00Z"
    }
  ]
}
*/
// Get dependencies for a specific task
const res = await fetch(
  'https://t0ggles.com/api/v1/dependencies?taskProjectKey=MARKETING&taskKey=45',
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_API_KEY',
    },
  }
);

const data = await res.json();
console.log(data.dependencies);
#
Add Dependency
Use the following endpoint to create a task dependency:

POST https://t0ggles.com/api/v1/dependencies
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Payload
#
Task Identification (required for both predecessor and successor)
You can identify tasks by ID or by the combination of project key and task key.

Field	Type	Description
predecessorId	string	Predecessor task ID
predecessorKey	number	Predecessor task key - use with predecessorProjectKey
predecessorProjectKey	string	Predecessor project key - use with predecessorKey
successorId	string	Successor task ID
successorKey	number	Successor task key - use with successorProjectKey
successorProjectKey	string	Successor project key - use with successorKey
#
Optional Fields
Field	Type	Description
lagDays	number	Days gap between predecessor completion and successor start. Default: 0
#
Response
Field	Type	Description
success	boolean	Indicates success
dependency	object	Created dependency object
error	string	Error code (if error)
message	string	Error message (if error)
#
Error Codes
Code	Description
SELF_REFERENCE	A task cannot depend on itself
TASKS_NOT_FOUND	One or both tasks were not found
DUPLICATE	This dependency already exists
CYCLE_DETECTED	This would create a circular dependency
#
Example
// Create dependency using task IDs
const res = await fetch('https://t0ggles.com/api/v1/dependencies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    predecessorId: 'task123',
    successorId: 'task456',
    lagDays: 1, // 1 day gap between tasks
  }),
});

const data = await res.json();
console.log(data);
/*
{
  success: true,
  dependency: {
    id: "dep789",
    predecessorId: "task123",
    predecessorKey: 45,
    predecessorProjectKey: "MARKETING",
    predecessorTitle: "Design mockups",
    predecessorUrl: "https://t0ggles.com/my-board/marketing-45",
    successorId: "task456",
    successorKey: 46,
    successorProjectKey: "MARKETING",
    successorTitle: "Implement design",
    successorUrl: "https://t0ggles.com/my-board/marketing-46",
    lagDays: 1,
    createdAt: "2025-03-15T14:30:00Z"
  }
}
*/
// Create dependency using project key + task key
const res = await fetch('https://t0ggles.com/api/v1/dependencies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    predecessorProjectKey: 'MARKETING',
    predecessorKey: 45,
    successorProjectKey: 'MARKETING',
    successorKey: 46,
  }),
});

console.log(await res.json());
#
Delete Dependency
Use the following endpoint to delete a task dependency:

DELETE https://t0ggles.com/api/v1/dependencies
#
Headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
#
Payload
You can identify the dependency to delete by its ID or by specifying both tasks.

#
Option 1: Delete by Dependency ID
Field	Type	Description
id	string	Dependency ID
#
Option 2: Delete by Task Identifiers
Field	Type	Description
predecessorId	string	Predecessor task ID
predecessorKey	number	Predecessor task key - use with predecessorProjectKey
predecessorProjectKey	string	Predecessor project key - use with predecessorKey
successorId	string	Successor task ID
successorKey	number	Successor task key - use with successorProjectKey
successorProjectKey	string	Successor project key - use with successorKey
#
Response
Field	Type	Description
success	boolean	Indicates success
error	boolean	Indicates error (if any)
message	string	Error message (if error is true)
#
Example
// Delete by dependency ID
const res = await fetch('https://t0ggles.com/api/v1/dependencies', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    id: 'dep789',
  }),
});

console.log(await res.json());
// { success: true }
// Delete by task identifiers
const res = await fetch('https://t0ggles.com/api/v1/dependencies', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    predecessorProjectKey: 'MARKETING',
    predecessorKey: 45,
    successorProjectKey: 'MARKETING',
    successorKey: 46,
  }),
});

console.log(await res.json());
// { success: true }