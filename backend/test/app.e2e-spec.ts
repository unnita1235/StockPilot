import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    }, 30000); // 30s timeout for connection attempts

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('/api/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/api/health')
            .expect(200)
            .expect((res) => {
                if (res.body.status !== 'ok') throw new Error('Status not ok');
            });
    });
});
