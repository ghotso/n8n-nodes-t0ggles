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
		}

		throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
	}
}

