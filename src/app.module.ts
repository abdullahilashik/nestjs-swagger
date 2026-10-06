import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/libsql';
import { PostsModule } from './posts/posts.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DrizzleModule.forRoot({
      drizzle,
      connection: process.env.DATABASE_URL!
    }),
    PostsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
