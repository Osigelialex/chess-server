import express, { Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const router = express.Router();

const options: swaggerJSDoc.Options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Chess Server API",
      version: "1.0.0",
      description: "A backend server for multiplayer chess"
    },
    tags: [
      {
        name: "Authentication",
        description: "Authentication API"
      },
      {
        name: "Games",
        description: "Games API"
      }
    ],
    servers: [
      {
        url: `http://localhost:7000/api`,
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token authentication for API"
        }
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Status of the response. Could be Success or Error",
              example: "success"
            },
            message: {
              type: "string",
              description: "Message describing the response"
            },
            data: {
              type: "object",
              description: "Contains the data for the response",
              example: []
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Status of the response",
              example: "error"
            },
            message: {
              type: "string",
              description: "Message describing the response"
            },
            errors: {
              type: "object",
              description: "Contains validation errors",
              example: {}
            }
          }
        },
        SignupDTO: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string" },
            email: { type: "string" },
            password: { type: "string" }
          }
        },
        LoginDTO: {
          type: "object",
          required: ["emailOrUsername", "password"],
          properties: {
            emailOrUsername: { type: "string" },
            password: { type: "string" }
          }
        },
        TokenResponseDataDTO: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" }
          }
        },
        RefreshTokenResponseDTO: {
          type: "object",
          properties: {
            accessToken: { type: "string" }
          }
        },
        RefreshTokenDTO: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" }
          }
        },
        UserResponseDTO: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            rating: { type: "integer" },
            bio: { type: "string" },
            createdAt: { type: "string" }
          }
        },
        CreateGameDTO: {
          type: 'object',
          properties: {
            timeControl: { type: "string" },
            sideToPlay: { type: "string" }
          }
        },
        CreateGuestGameDTO: {
          type: 'object',
          properties: {
            sideToPlay: { type: "string" }
          }
        },
        GuestGameCreatedResponseDTO: {
          type: 'object',
          properties: {
            id: { type: "string" },
            jwt: { type: "string" },
            code: { type: "string" },
          }
        },
        GameCreatedResponseDTO: {
          type: 'object',
          properties: {
            id: { type: "string" },
            timeControl: { type: "string" },
            boardState: { type: "string" },
            status: { type: "string" },
            createdAt: { type: "string" }
          }
        },
        JoinedGuestGameResponseDTO: {
          type: "object",
          properties: {
            id: { type: "string" },
            jwt: { type: "string" }
          }
        },
        RetrieveGameResponseDTO: {
          type: "object",
          properties: {
            id: { type: "string" },
            timeControl: { type: "string" },
            boardState: { type: "string" },
            result: { type: "string" },
            createdAt: { type: "string" }
          }
        },
        PaginatedResponseDTO: {
          type: "object",
          properties: {
            results: { type: "array" },
            pagination: { type: "object" }
          }
        },
        PaginationMetaDataDTO: {
          type: "object",
          properties: {
            count: { type: "integer" },
            next: { type: "string" },
            previous: { type: "string" }
          }
        }
      },
      responses: {
        BadRequest: {
          description: "Bad Request",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  {
                    type: "object",
                    properties: {
                      message: {
                        example: "Validation Failed"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        UnauthorizedError: {
          description: "Unauthorized Error",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  {
                    type: "object",
                    properties: {
                      message: {
                        example: "Access token is missing or invalid"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  {
                    type: "object",
                    properties: {
                      message: {
                        example: "Internal Server Error"
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: "Resource Not Found",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ErrorResponse" },
                  {
                    type: "object",
                    properties: {
                      message: {
                        example: "Resource Not Found"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
  },
  apis: ["./src/routes/*.ts"]
}

const swaggerSpec = swaggerJSDoc(options)
require("swagger-model-validator")(swaggerSpec)

router.get("/json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerJSDoc);
})

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;
