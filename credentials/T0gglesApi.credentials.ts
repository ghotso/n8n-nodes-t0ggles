import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class T0gglesApi implements ICredentialType {
	name = 't0gglesApi';

	displayName = 't0ggles API';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for your t0ggles board. Generate it in Board Settings → Services → API Key.',
		},
	];
}

