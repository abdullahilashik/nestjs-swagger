// src/common/swagger/swagger.interface.ts

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
  enabled: boolean;
  persistAuthorization: boolean;
  servers: Array<{
    url: string;
    description: string;
  }>;
}