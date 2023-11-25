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
        name: 'Associations',
        description: 'Endpoints related to the associations.',
      },
    ],
    components: {
      securitySchemas: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    `${__dirname}/api/**/*.{ts,js}`,
    `${__dirname}/dto/*.{ts,js}`,
    `${__dirname}/exception/*.{ts,js}`,
  ],
}

export default swaggerJsdoc(options)
