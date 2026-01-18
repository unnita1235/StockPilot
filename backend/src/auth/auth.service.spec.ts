import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let mockUserModel: any;
    let mockJwtService: any;

    beforeEach(async () => {
        mockUserModel = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        mockJwtService = {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getModelToken('User'),
                    useValue: mockUserModel,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const registerDto = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                role: 'staff' as any,
            };

            mockUserModel.findOne.mockResolvedValue(null);
            const mockUser = {
                _id: 'user123',
                email: registerDto.email,
                name: registerDto.name,
                role: registerDto.role,
                save: jest.fn().mockResolvedValue(true),
            };
            mockUserModel.create = jest.fn().mockReturnValue(mockUser);

            const result = await service.register(registerDto);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
            expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
        });

        it('should throw ConflictException if user already exists', async () => {
            const registerDto = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User',
                role: 'staff' as any,
            };

            mockUserModel.findOne.mockResolvedValue({ email: registerDto.email });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                _id: 'user123',
                email: loginDto.email,
                password: await bcrypt.hash(loginDto.password, 10),
                name: 'Test User',
                role: 'staff',
            };

            mockUserModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.login(loginDto);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
        });

        it('should throw UnauthorizedException with invalid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            mockUserModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });
});
