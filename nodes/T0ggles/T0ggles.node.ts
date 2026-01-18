import {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeOperationError,
} from 'n8n-workflow';

function buildTaskFromParameters(
	title: string,
	projectKey: string,
	descriptionType: string,
	descriptionContent: string,
	additionalFields: IDataObject,
): IDataObject {
	const task: IDataObject = {
		title,
		projectKey,
		descriptionType,
		descriptionContent,
	};

	if (additionalFields.status) {
		task.status = additionalFields.status;
	}

	if (additionalFields.assignedUserEmail) {
		task.assignedUserEmail = additionalFields.assignedUserEmail;
	}

	if (additionalFields.priority) {
		task.priority = additionalFields.priority;
	}

	if (additionalFields.pinToTop !== undefined) {
		task.pinToTop = additionalFields.pinToTop;
	}

	if (additionalFields.tags) {
		const tags = (additionalFields.tags as string)
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag !== '');
		if (tags.length > 0) {
			task.tags = tags;
		}
	}

	if (additionalFields.startDate) {
		const startDate = additionalFields.startDate as string;
		task.startDate = new Date(startDate).toISOString();
	}

	if (additionalFields.dueDate) {
		const dueDate = additionalFields.dueDate as string;
		task.dueDate = new Date(dueDate).toISOString();
	}

	if (additionalFields.propertiesJson) {
		let parsedProperties: IDataObject;
		try {
			parsedProperties = JSON.parse(additionalFields.propertiesJson as string);
		} catch (error) {
			throw new Error('Could not parse Properties JSON. Ensure it is valid JSON.');
		}

		if (parsedProperties === null || Array.isArray(parsedProperties)) {
			throw new Error('Properties JSON must define an object.');
		}

		task.properties = parsedProperties;
	}

	return task;
}

function buildUpdateTaskFromParameters(
	taskIdentifier: string,
	identifierValue: IDataObject,
	updateFields: IDataObject,
): IDataObject {
	const task: IDataObject = {};

	// Set task identifier
	if (taskIdentifier === 'id') {
		task.id = identifierValue.id;
	} else {
		task.projectKey = identifierValue.projectKey;
		task.key = identifierValue.key;
	}

	// Add updateable fields
	if (updateFields.title) {
		task.title = updateFields.title;
	}

	if (updateFields.descriptionType) {
		task.descriptionType = updateFields.descriptionType;
	}

	if (updateFields.descriptionContent) {
		task.descriptionContent = updateFields.descriptionContent;
	}

	if (updateFields.status) {
		task.status = updateFields.status;
	}

	if (updateFields.assignedUserEmail !== undefined) {
		task.assignedUserEmail = updateFields.assignedUserEmail;
	}

	if (updateFields.priority !== undefined) {
		task.priority = updateFields.priority === '' ? '' : updateFields.priority;
	}

	if (updateFields.pinToTop !== undefined) {
		task.pinToTop = updateFields.pinToTop;
	}

	if (updateFields.tags) {
		const tags = (updateFields.tags as string)
			.split(',')
			.map((tag) => tag.trim())
			.filter((tag) => tag !== '');
		if (tags.length > 0) {
			task.tags = tags;
		}
	}

	if (updateFields.startDate !== undefined) {
		task.startDate = updateFields.startDate === '' ? '' : new Date(updateFields.startDate as string).toISOString();
	}

	if (updateFields.dueDate !== undefined) {
		task.dueDate = updateFields.dueDate === '' ? '' : new Date(updateFields.dueDate as string).toISOString();
	}

	if (updateFields.propertiesJson) {
		let parsedProperties: IDataObject;
		try {
			parsedProperties = JSON.parse(updateFields.propertiesJson as string);
		} catch (error) {
			throw new Error('Could not parse Properties JSON. Ensure it is valid JSON.');
		}

		if (parsedProperties === null || Array.isArray(parsedProperties)) {
			throw new Error('Properties JSON must define an object.');
		}

		task.properties = parsedProperties;
	}

	// Handle parent task fields
	if (updateFields.parentIdentifier) {
		const parentIdentifier = updateFields.parentIdentifier as string;
		if (parentIdentifier === 'none') {
			task.parentId = '';
		} else if (parentIdentifier === 'parentId') {
			task.parentId = updateFields.parentId;
		} else if (parentIdentifier === 'parentProjectKeyAndKey') {
			task.parentProjectKey = updateFields.parentProjectKey;
			task.parentKey = updateFields.parentKey;
		}
	}

	return task;
}

async function t0gglesApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestOptions['method'],
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('t0gglesApi');

	if (!credentials?.apiKey) {
		throw new NodeOperationError(this.getNode(), 'No API key provided. Please configure your t0ggles credentials.');
	}

	const options: IHttpRequestOptions = {
		method,
		url: `https://t0ggles.com/api/v1${endpoint}`,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
		},
		json: true,
		qs,
	};

	if (method !== 'GET' && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (options.qs && Object.keys(options.qs as IDataObject).length === 0) {
		delete options.qs;
	}

	try {
		return await this.helpers.httpRequest(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export class T0ggles implements INodeType {
	description: INodeTypeDescription = {
		displayName: 't0ggles',
		name: 't0ggles',
		icon: 'file:t0ggles.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with t0ggles tasks API',
		defaults: {
			name: 't0ggles',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 't0gglesApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Task',
						value: 'task',
					},
					{
						name: 'Dependency',
						value: 'dependency',
					},
				],
				default: 'task',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create tasks',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many tasks',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update tasks',
					},
				],
				default: 'getAll',
				displayOptions: {
					show: {
						resource: ['task'],
					},
				},
			},

			// Get Many
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Project Key',
						name: 'projectKey',
						type: 'string',
						default: '',
						description: 'Comma-separated project keys to filter tasks by',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
						description: 'Comma-separated status names to filter tasks by',
					},
					{
						displayName: 'Description Type',
						name: 'descriptionType',
						type: 'options',
						options: [
							{ name: 'HTML', value: 'html' },
							{ name: 'Markdown', value: 'markdown' },
							{ name: 'Text', value: 'text' },
						],
						default: 'text',
					},
					{
						displayName: 'Assigned User Email',
						name: 'assignedUserEmail',
						type: 'string',
						default: '',
						description: 'Comma-separated emails to filter tasks by assignee',
					},
					{
						displayName: 'Priority',
						name: 'priority',
						type: 'options',
						options: [
							{ name: 'Any', value: '' },
							{ name: 'High', value: 'high' },
							{ name: 'Low', value: 'low' },
							{ name: 'Medium', value: 'medium' },
						],
						default: '',
					},
					{
						displayName: 'Pin To Top',
						name: 'pinToTop',
						type: 'options',
						options: [
							{ name: 'Any', value: '' },
							{ name: 'False', value: 'false' },
							{ name: 'True', value: 'true' },
						],
						default: '',
					},
					{
						displayName: 'Tag',
						name: 'tag',
						type: 'string',
						default: '',
						description: 'Comma-separated tags to filter tasks by',
					},
					{
						displayName: 'Start Date',
						name: 'startDate',
						type: 'string',
						default: '',
						description: 'Single date or range (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD)',
					},
					{
						displayName: 'Due Date',
						name: 'dueDate',
						type: 'string',
						default: '',
						description: 'Single date or range (YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD)',
					},
					{
						displayName: 'Custom Property Filters (JSON)',
						name: 'customPropertyFiltersJson',
						type: 'string',
						typeOptions: {
							rows: 4,
						},
						default: '',
						description: 'JSON object with custom property filters, e.g. {"prop_Region": "North America"}',
					},
				],
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['getAll'],
					},
				},
			},

			// Create
			{
				displayName: 'Tasks',
				name: 'tasks',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Task',
				default: {},
				options: [
					{
						displayName: 'Task',
						name: 'task',
						values: [
							{
								displayName: 'Title',
								name: 'title',
								type: 'string',
								default: '',
								required: true,
								description: 'Task title',
							},
							{
								displayName: 'Project Key',
								name: 'projectKey',
								type: 'string',
								default: '',
								required: true,
								description: 'Project key (e.g., SWIPER, MARKETING)',
							},
							{
								displayName: 'Description Type',
								name: 'descriptionType',
								type: 'options',
								options: [
									{ name: 'HTML', value: 'html' },
									{ name: 'Markdown', value: 'markdown' },
									{ name: 'Text', value: 'text' },
								],
								default: 'text',
								required: true,
							},
							{
								displayName: 'Description Content',
								name: 'descriptionContent',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
								default: '',
								required: true,
							},
							{
								displayName: 'Additional Fields',
								name: 'additionalFields',
								type: 'collection',
								placeholder: 'Add Field',
								default: {},
								options: [
									{
										displayName: 'Status',
										name: 'status',
										type: 'string',
										default: '',
										description: 'Status name (e.g., To Do, In Progress, Done)',
									},
									{
										displayName: 'Assigned User Email',
										name: 'assignedUserEmail',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Due Date',
										name: 'dueDate',
										type: 'dateTime',
										default: '',
									},
									{
										displayName: 'Pin To Top',
										name: 'pinToTop',
										type: 'boolean',
										default: false,
									},
									{
										displayName: 'Priority',
										name: 'priority',
										type: 'options',
										options: [
											{ name: 'High', value: 'high' },
											{ name: 'Low', value: 'low' },
											{ name: 'Medium', value: 'medium' },
										],
										default: 'medium',
									},
									{
										displayName: 'Properties (JSON)',
										name: 'propertiesJson',
										type: 'string',
										typeOptions: {
											rows: 4,
										},
										default: '',
										description: 'JSON object defining custom property values',
									},
									{
										displayName: 'Start Date',
										name: 'startDate',
										type: 'dateTime',
										default: '',
									},
									{
										displayName: 'Tags',
										name: 'tags',
										type: 'string',
										default: '',
										description: 'Comma-separated list of tags',
									},
								],
							},
							{
								displayName: 'Subtasks',
								name: 'subtasks',
								type: 'fixedCollection',
								typeOptions: {
									multipleValues: true,
								},
								placeholder: 'Add Subtask',
								default: {},
								options: [
									{
										displayName: 'Subtask',
										name: 'subtask',
										values: [
											{
												displayName: 'Title',
												name: 'title',
												type: 'string',
												default: '',
												required: true,
												description: 'Subtask title',
											},
											{
												displayName: 'Project Key',
												name: 'projectKey',
												type: 'string',
												default: '',
												required: true,
												description: 'Project key for the subtask',
											},
											{
												displayName: 'Description Type',
												name: 'descriptionType',
												type: 'options',
												options: [
													{ name: 'HTML', value: 'html' },
													{ name: 'Markdown', value: 'markdown' },
													{ name: 'Text', value: 'text' },
												],
												default: 'text',
												required: true,
											},
											{
												displayName: 'Description Content',
												name: 'descriptionContent',
												type: 'string',
												typeOptions: {
													rows: 3,
												},
												default: '',
												required: true,
											},
											{
												displayName: 'Additional Fields',
												name: 'additionalFields',
												type: 'collection',
												placeholder: 'Add Field',
												default: {},
												options: [
													{
														displayName: 'Assigned User Email',
														name: 'assignedUserEmail',
														type: 'string',
														default: '',
													},
													{
														displayName: 'Due Date',
														name: 'dueDate',
														type: 'dateTime',
														default: '',
													},
													{
														displayName: 'Pin To Top',
														name: 'pinToTop',
														type: 'boolean',
														default: false,
													},
													{
														displayName: 'Priority',
														name: 'priority',
														type: 'options',
														options: [
															{ name: 'High', value: 'high' },
															{ name: 'Low', value: 'low' },
															{ name: 'Medium', value: 'medium' },
														],
														default: 'medium',
													},
													{
														displayName: 'Properties (JSON)',
														name: 'propertiesJson',
														type: 'string',
														typeOptions: {
															rows: 3,
														},
														default: '',
														description: 'JSON object defining custom property values',
													},
													{
														displayName: 'Start Date',
														name: 'startDate',
														type: 'dateTime',
														default: '',
													},
													{
														displayName: 'Tags',
														name: 'tags',
														type: 'string',
														default: '',
														description: 'Comma-separated list of tags',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['create'],
					},
				},
			},

			// Update
			{
				displayName: 'Tasks',
				name: 'tasks',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Task',
				default: {},
				options: [
					{
						displayName: 'Task',
						name: 'task',
						values: [
							{
								displayName: 'Task Identification',
								name: 'taskIdentifier',
								type: 'options',
								options: [
									{
										name: 'By ID',
										value: 'id',
									},
									{
										name: 'By Project Key + Key',
										value: 'projectKeyAndKey',
									},
								],
								default: 'id',
								required: true,
							},
							{
								displayName: 'Task ID',
								name: 'id',
								type: 'string',
								default: '',
								required: true,
								description: 'Task ID to update',
								displayOptions: {
									show: {
										taskIdentifier: ['id'],
									},
								},
							},
							{
								displayName: 'Project Key',
								name: 'projectKey',
								type: 'string',
								default: '',
								required: true,
								description: 'Project key (e.g., MARKETING)',
								displayOptions: {
									show: {
										taskIdentifier: ['projectKeyAndKey'],
									},
								},
							},
							{
								displayName: 'Task Key',
								name: 'key',
								type: 'number',
								typeOptions: {
									numberStepSize: 1,
								},
								default: 0,
								required: true,
								description: 'Task key number (e.g., 45)',
								displayOptions: {
									show: {
										taskIdentifier: ['projectKeyAndKey'],
									},
								},
							},
							{
								displayName: 'Update Fields',
								name: 'updateFields',
								type: 'collection',
								placeholder: 'Add Field',
								default: {},
								options: [
									{
										displayName: 'Title',
										name: 'title',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Description Type',
										name: 'descriptionType',
										type: 'options',
										options: [
											{ name: 'HTML', value: 'html' },
											{ name: 'Markdown', value: 'markdown' },
											{ name: 'Text', value: 'text' },
										],
										default: 'text',
										description: 'Required if descriptionContent is provided',
									},
									{
										displayName: 'Description Content',
										name: 'descriptionContent',
										type: 'string',
										typeOptions: {
											rows: 4,
										},
										default: '',
										description: 'Required if descriptionType is provided',
									},
									{
										displayName: 'Status',
										name: 'status',
										type: 'string',
										default: '',
										description: 'Status name (e.g., To Do, In Progress, Done)',
									},
									{
										displayName: 'Assigned User Email',
										name: 'assignedUserEmail',
										type: 'string',
										default: '',
										description: 'Email of the board member (empty string to unassign)',
									},
									{
										displayName: 'Priority',
										name: 'priority',
										type: 'options',
										options: [
											{ name: 'High', value: 'high' },
											{ name: 'Low', value: 'low' },
											{ name: 'Medium', value: 'medium' },
											{ name: 'Clear Priority', value: '' },
										],
										default: '',
										description: 'Empty string to clear priority',
									},
									{
										displayName: 'Pin To Top',
										name: 'pinToTop',
										type: 'boolean',
										default: false,
									},
									{
										displayName: 'Tags',
										name: 'tags',
										type: 'string',
										default: '',
										description: 'Comma-separated list of tags (replaces existing tags)',
									},
									{
										displayName: 'Start Date',
										name: 'startDate',
										type: 'dateTime',
										default: '',
										description: 'ISO date string or empty to clear',
									},
									{
										displayName: 'Due Date',
										name: 'dueDate',
										type: 'dateTime',
										default: '',
										description: 'ISO date string or empty to clear',
									},
									{
										displayName: 'Properties (JSON)',
										name: 'propertiesJson',
										type: 'string',
										typeOptions: {
											rows: 4,
										},
										default: '',
										description: 'JSON object defining custom property values (merged with existing)',
									},
									{
										displayName: 'Parent Task Identification',
										name: 'parentIdentifier',
										type: 'options',
										options: [
											{
												name: 'None (Unlink from Parent)',
												value: 'none',
											},
											{
												name: 'By Parent ID',
												value: 'parentId',
											},
											{
												name: 'By Parent Project Key + Key',
												value: 'parentProjectKeyAndKey',
											},
										],
										default: '',
										description: 'Make this task a subtask or unlink it from parent',
									},
									{
										displayName: 'Parent Task ID',
										name: 'parentId',
										type: 'string',
										default: '',
										displayOptions: {
											show: {
												parentIdentifier: ['parentId'],
											},
										},
									},
									{
										displayName: 'Parent Project Key',
										name: 'parentProjectKey',
										type: 'string',
										default: '',
										displayOptions: {
											show: {
												parentIdentifier: ['parentProjectKeyAndKey'],
											},
										},
									},
									{
										displayName: 'Parent Task Key',
										name: 'parentKey',
										type: 'number',
										typeOptions: {
											numberStepSize: 1,
										},
										default: 0,
										displayOptions: {
											show: {
												parentIdentifier: ['parentProjectKeyAndKey'],
											},
										},
									},
								],
							},
						],
					},
				],
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['update'],
					},
				},
			},

			// Dependency Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create a dependency',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many dependencies',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a dependency',
					},
				],
				default: 'getAll',
				displayOptions: {
					show: {
						resource: ['dependency'],
					},
				},
			},

			// Get Many Dependencies
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Task Identification',
						name: 'taskIdentifier',
						type: 'options',
						options: [
							{
								name: 'By Task ID',
								value: 'taskId',
							},
							{
								name: 'By Project Key + Key',
								value: 'projectKeyAndKey',
							},
						],
						default: 'taskId',
					},
					{
						displayName: 'Task ID',
						name: 'taskId',
						type: 'string',
						default: '',
						description: 'Filter by task ID (returns dependencies where task is predecessor or successor)',
						displayOptions: {
							show: {
								taskIdentifier: ['taskId'],
							},
						},
					},
					{
						displayName: 'Task Project Key',
						name: 'taskProjectKey',
						type: 'string',
						default: '',
						description: 'Project key (e.g., MARKETING)',
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
					{
						displayName: 'Task Key',
						name: 'taskKey',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						description: 'Task key number (e.g., 45)',
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['getAll'],
					},
				},
			},

			// Create Dependency
			{
				displayName: 'Predecessor Task',
				name: 'predecessorTask',
				type: 'collection',
				placeholder: 'Add Predecessor',
				default: {},
				options: [
					{
						displayName: 'Task Identification',
						name: 'taskIdentifier',
						type: 'options',
						options: [
							{
								name: 'By Task ID',
								value: 'id',
							},
							{
								name: 'By Project Key + Key',
								value: 'projectKeyAndKey',
							},
						],
						default: 'id',
						required: true,
					},
					{
						displayName: 'Task ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['id'],
							},
						},
					},
					{
						displayName: 'Project Key',
						name: 'projectKey',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
					{
						displayName: 'Task Key',
						name: 'key',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Successor Task',
				name: 'successorTask',
				type: 'collection',
				placeholder: 'Add Successor',
				default: {},
				options: [
					{
						displayName: 'Task Identification',
						name: 'taskIdentifier',
						type: 'options',
						options: [
							{
								name: 'By Task ID',
								value: 'id',
							},
							{
								name: 'By Project Key + Key',
								value: 'projectKeyAndKey',
							},
						],
						default: 'id',
						required: true,
					},
					{
						displayName: 'Task ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['id'],
							},
						},
					},
					{
						displayName: 'Project Key',
						name: 'projectKey',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
					{
						displayName: 'Task Key',
						name: 'key',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				options: [
					{
						displayName: 'Lag Days',
						name: 'lagDays',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						description: 'Days gap between predecessor completion and successor start',
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['create'],
					},
				},
			},

			// Delete Dependency
			{
				displayName: 'Dependency Identification',
				name: 'dependencyIdentifier',
				type: 'options',
				options: [
					{
						name: 'By Dependency ID',
						value: 'id',
					},
					{
						name: 'By Task Identifiers',
						value: 'taskIdentifiers',
					},
				],
				default: 'id',
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['delete'],
					},
				},
			},
			{
				displayName: 'Dependency ID',
				name: 'dependencyId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['delete'],
						dependencyIdentifier: ['id'],
					},
				},
			},
			{
				displayName: 'Predecessor Task',
				name: 'predecessorTask',
				type: 'collection',
				placeholder: 'Add Predecessor',
				default: {},
				options: [
					{
						displayName: 'Task Identification',
						name: 'taskIdentifier',
						type: 'options',
						options: [
							{
								name: 'By Task ID',
								value: 'id',
							},
							{
								name: 'By Project Key + Key',
								value: 'projectKeyAndKey',
							},
						],
						default: 'id',
						required: true,
					},
					{
						displayName: 'Task ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['id'],
							},
						},
					},
					{
						displayName: 'Project Key',
						name: 'projectKey',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
					{
						displayName: 'Task Key',
						name: 'key',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['delete'],
						dependencyIdentifier: ['taskIdentifiers'],
					},
				},
			},
			{
				displayName: 'Successor Task',
				name: 'successorTask',
				type: 'collection',
				placeholder: 'Add Successor',
				default: {},
				options: [
					{
						displayName: 'Task Identification',
						name: 'taskIdentifier',
						type: 'options',
						options: [
							{
								name: 'By Task ID',
								value: 'id',
							},
							{
								name: 'By Project Key + Key',
								value: 'projectKeyAndKey',
							},
						],
						default: 'id',
						required: true,
					},
					{
						displayName: 'Task ID',
						name: 'id',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['id'],
							},
						},
					},
					{
						displayName: 'Project Key',
						name: 'projectKey',
						type: 'string',
						default: '',
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
					{
						displayName: 'Task Key',
						name: 'key',
						type: 'number',
						typeOptions: {
							numberStepSize: 1,
						},
						default: 0,
						required: true,
						displayOptions: {
							show: {
								taskIdentifier: ['projectKeyAndKey'],
							},
						},
					},
				],
				displayOptions: {
					show: {
						resource: ['dependency'],
						operation: ['delete'],
						dependencyIdentifier: ['taskIdentifiers'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		if (resource === 'task') {
			if (operation === 'getAll') {
				const filters = (this.getNodeParameter('filters', 0, {}) ?? {}) as IDataObject;
				const qs: IDataObject = {};

				const filterKeys = [
					'projectKey',
					'status',
					'assignedUserEmail',
					'tag',
					'startDate',
					'dueDate',
				] as const;

				for (const key of filterKeys) {
					const value = filters[key];
					if (value !== undefined && value !== '') {
						qs[key] = value;
					}
				}

				if (filters.descriptionType) {
					qs.descriptionType = filters.descriptionType;
				}

				if (filters.priority !== undefined && filters.priority !== '') {
					qs.priority = filters.priority;
				}

				if (filters.pinToTop !== undefined && filters.pinToTop !== '') {
					qs.pinToTop = filters.pinToTop;
				}

				if (filters.customPropertyFiltersJson) {
					let parsed: IDataObject;
					try {
						parsed = JSON.parse(filters.customPropertyFiltersJson as string);
					} catch (error) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not parse Custom Property Filters JSON. Ensure it is valid JSON.',
						);
					}

					if (parsed === null || Array.isArray(parsed)) {
						throw new NodeOperationError(
							this.getNode(),
							'Custom Property Filters JSON must define an object.',
						);
					}

					for (const [key, value] of Object.entries(parsed)) {
						qs[key] = value;
					}
				}

				const responseData = (await t0gglesApiRequest.call(
					this,
					'GET',
					'/tasks',
					{},
					qs,
				)) as IDataObject;

				const tasks = (responseData.tasks as IDataObject[]) ?? [];

				for (const task of tasks) {
					returnData.push({
						json: task,
					});
				}

				return [returnData];
			}

			if (operation === 'create') {
				const allTasks: IDataObject[] = [];

				for (let i = 0; i < items.length; i++) {
					try {
						const tasksData = (this.getNodeParameter('tasks', i, {}) ?? {}) as IDataObject;

						if (tasksData.task && Array.isArray(tasksData.task)) {
							for (const taskData of tasksData.task as IDataObject[]) {
								const task = buildTaskFromParameters(
									taskData.title as string,
									taskData.projectKey as string,
									taskData.descriptionType as string,
									taskData.descriptionContent as string,
									(taskData.additionalFields as IDataObject) ?? {},
								);

								const subtasksData = (taskData.subtasks as IDataObject) ?? {};
								if (subtasksData.subtask && Array.isArray(subtasksData.subtask)) {
									const subtasks: IDataObject[] = [];
									for (const subtaskData of subtasksData.subtask as IDataObject[]) {
										const subtask = buildTaskFromParameters(
											subtaskData.title as string,
											subtaskData.projectKey as string,
											subtaskData.descriptionType as string,
											subtaskData.descriptionContent as string,
											(subtaskData.additionalFields as IDataObject) ?? {},
										);
										subtasks.push(subtask);
									}
									if (subtasks.length > 0) {
										task.subtasks = subtasks;
									}
								}

								allTasks.push(task);
							}
						}
					} catch (error) {
						if (error instanceof Error) {
							throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
						}
						throw error;
					}
				}

				if (allTasks.length === 0) {
					throw new NodeOperationError(this.getNode(), 'No tasks to create. Please add at least one task.');
				}

				const body: IDataObject = {
					tasks: allTasks,
				};

				const responseData = (await t0gglesApiRequest.call(
					this,
					'POST',
					'/tasks',
					body,
				)) as IDataObject;

				returnData.push({
					json: responseData,
				});

				return [returnData];
			}

			if (operation === 'update') {
				const allTasks: IDataObject[] = [];

				for (let i = 0; i < items.length; i++) {
					try {
						const tasksData = (this.getNodeParameter('tasks', i, {}) ?? {}) as IDataObject;

						if (tasksData.task && Array.isArray(tasksData.task)) {
							for (const taskData of tasksData.task as IDataObject[]) {
								const taskIdentifier = taskData.taskIdentifier as string;
								const identifierValue: IDataObject = {};

								if (taskIdentifier === 'id') {
									identifierValue.id = taskData.id;
								} else {
									identifierValue.projectKey = taskData.projectKey;
									identifierValue.key = taskData.key;
								}

								const updateFields = (taskData.updateFields as IDataObject) ?? {};
								const task = buildUpdateTaskFromParameters(
									taskIdentifier,
									identifierValue,
									updateFields,
								);

								allTasks.push(task);
							}
						}
					} catch (error) {
						if (error instanceof Error) {
							throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
						}
						throw error;
					}
				}

				if (allTasks.length === 0) {
					throw new NodeOperationError(this.getNode(), 'No tasks to update. Please add at least one task.');
				}

				const body: IDataObject = {
					tasks: allTasks,
				};

				const responseData = (await t0gglesApiRequest.call(
					this,
					'PUT',
					'/tasks',
					body,
				)) as IDataObject;

				const updatedTasks = (responseData.tasks as IDataObject[]) ?? [];

				for (const task of updatedTasks) {
					returnData.push({
						json: task,
					});
				}

				return [returnData];
			}
		}

		if (resource === 'dependency') {
			if (operation === 'getAll') {
				const filters = (this.getNodeParameter('filters', 0, {}) ?? {}) as IDataObject;
				const qs: IDataObject = {};

				if (filters.taskIdentifier === 'taskId' && filters.taskId) {
					qs.taskId = filters.taskId;
				} else if (filters.taskIdentifier === 'projectKeyAndKey') {
					if (filters.taskProjectKey) {
						qs.taskProjectKey = filters.taskProjectKey;
					}
					if (filters.taskKey !== undefined && filters.taskKey !== 0) {
						qs.taskKey = filters.taskKey;
					}
				}

				const responseData = (await t0gglesApiRequest.call(
					this,
					'GET',
					'/dependencies',
					{},
					qs,
				)) as IDataObject;

				const dependencies = (responseData.dependencies as IDataObject[]) ?? [];

				for (const dependency of dependencies) {
					returnData.push({
						json: dependency,
					});
				}

				return [returnData];
			}

			if (operation === 'create') {
				const predecessorTask = (this.getNodeParameter('predecessorTask', 0, {}) ?? {}) as IDataObject;
				const successorTask = (this.getNodeParameter('successorTask', 0, {}) as IDataObject) ?? {};
				const additionalFields = (this.getNodeParameter('additionalFields', 0, {}) ?? {}) as IDataObject;

				const dependency: IDataObject = {};

				// Set predecessor
				const predecessorIdentifier = predecessorTask.taskIdentifier as string;
				if (predecessorIdentifier === 'id') {
					dependency.predecessorId = predecessorTask.id;
				} else {
					dependency.predecessorProjectKey = predecessorTask.projectKey;
					dependency.predecessorKey = predecessorTask.key;
				}

				// Set successor
				const successorIdentifier = successorTask.taskIdentifier as string;
				if (successorIdentifier === 'id') {
					dependency.successorId = successorTask.id;
				} else {
					dependency.successorProjectKey = successorTask.projectKey;
					dependency.successorKey = successorTask.key;
				}

				// Set optional fields
				if (additionalFields.lagDays !== undefined) {
					dependency.lagDays = additionalFields.lagDays;
				}

				const body: IDataObject = dependency;

				const responseData = (await t0gglesApiRequest.call(
					this,
					'POST',
					'/dependencies',
					body,
				)) as IDataObject;

				if (responseData.dependency) {
					returnData.push({
						json: responseData.dependency as IDataObject,
					});
				} else {
					returnData.push({
						json: responseData,
					});
				}

				return [returnData];
			}

			if (operation === 'delete') {
				const dependencyIdentifier = this.getNodeParameter('dependencyIdentifier', 0) as string;
				const body: IDataObject = {};

				if (dependencyIdentifier === 'id') {
					const dependencyId = this.getNodeParameter('dependencyId', 0) as string;
					body.id = dependencyId;
				} else {
					const predecessorTask = (this.getNodeParameter('predecessorTask', 0, {}) ?? {}) as IDataObject;
					const successorTask = (this.getNodeParameter('successorTask', 0, {}) ?? {}) as IDataObject;

					const predecessorIdentifier = predecessorTask.taskIdentifier as string;
					if (predecessorIdentifier === 'id') {
						body.predecessorId = predecessorTask.id;
					} else {
						body.predecessorProjectKey = predecessorTask.projectKey;
						body.predecessorKey = predecessorTask.key;
					}

					const successorIdentifier = successorTask.taskIdentifier as string;
					if (successorIdentifier === 'id') {
						body.successorId = successorTask.id;
					} else {
						body.successorProjectKey = successorTask.projectKey;
						body.successorKey = successorTask.key;
					}
				}

				const responseData = (await t0gglesApiRequest.call(
					this,
					'DELETE',
					'/dependencies',
					body,
				)) as IDataObject;

				returnData.push({
					json: responseData,
				});

				return [returnData];
			}
		}

		throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
	}
}

