import { existsSync } from "node:fs";
import {
  BadRequestException,
  StandardSchemaValidationPipe,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WsAdapter } from "@nestjs/platform-ws";
import { AppModule } from "./app.module.js";

// Locally the connection string lives in server/.env; hosted environments inject it.
if (existsSync(".env")) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("/api");
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) =>
        new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          errorCode: "VALIDATION_ERROR",
          message: issues.map((issue) => issue.message).join("; "),
        }),
    }),
  );
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
