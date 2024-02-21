import config from 'config'
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Plander API docs',
      version: '0.0.1',
    },
    tags: [
      {
        name: 'Authentication',
      },
      {
        name: 'Associations',
      },
      {
        name: 'Inviting & registering members',
      },
      {
        name: 'Restore forgotten password',
      },
      {
        name: 'Members',
        description: 'Endpoints related to fetching & altering members.',
      },
      {
        name: 'Assignments',
        description: 'Endpoints related to fetching & altering assignments.',
      },
      {
        name: 'Reports',
        description: 'Endpoints related to fetching & altering reports.',
      },
      {
        name: 'Chats',
        description: 'Endpoints related to fetching chats.',
      },
    ],
    components: {
      securitySchemes: {
        MemberAuthorization: {
          type: 'apiKey',
          name: config.get('jwt.headerName'),
          in: 'header',
        },
      },
    },
    security: [
      {
        MemberAuthorization: [],
      },
    ],
  },
  apis: [`${__dirname}/api/**/*.{ts,js}`, `${__dirname}/dto/**/*.{ts,js}`],
}

export default swaggerJsdoc(options)
