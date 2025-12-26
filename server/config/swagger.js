const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StockPilot API',
      version: '1.0.0',
      description: 'RESTful API documentation for StockPilot inventory management system',
      contact: {
        name: 'StockPilot Support',
        email: 'support@stockpilot.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server',
      },
      {
        url: 'https://api.stockpilot.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Item: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier',
            },
            name: {
              type: 'string',
              description: 'Item name',
              example: 'Premium Coffee Beans',
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'High-quality Arabica beans from Colombia',
            },
            stock: {
              type: 'integer',
              description: 'Current stock level',
              example: 15,
            },
            category: {
              type: 'string',
              enum: ['Raw Material', 'Packaging Material', 'Product for Sale'],
              description: 'Item category',
            },
            lowStockThreshold: {
              type: 'integer',
              description: 'Threshold for low stock alert',
              example: 10,
            },
            sku: {
              type: 'string',
              description: 'Stock Keeping Unit',
              example: 'RAW-COF-001',
            },
            unitPrice: {
              type: 'number',
              description: 'Price per unit',
              example: 25.99,
            },
            isLowStock: {
              type: 'boolean',
              description: 'Whether item is low in stock',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

