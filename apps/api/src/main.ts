import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Machine Observatory API")
    .setDescription(
      "Product-facing read API over chain facts + enrichment (see architecture spec: API decoupled from indexer).",
    )
    .setVersion("0.0.1")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));

  // 3000 is reserved for apps/web.
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`api listening on :${port} (docs at /docs)`);
}

void bootstrap();
