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
        description: 'Endpoints related to the authentication.',
      },
      {
        name: 'Associations',
        description: 'Endpoints related to the associations.',
      },
      {
        name: 'Members',
        description: 'Endpoints related to members.',
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
  apis: [`${__dirname}/api/**/*.{ts,js}`, `${__dirname}/dto/*.{ts,js}`],
}

export default swaggerJsdoc(options)
