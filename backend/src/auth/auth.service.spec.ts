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
        // Create a mock class that can be instantiated
        const mockSave = jest.fn();
        const mockToObject = jest.fn();
        
        mockUserModel = jest.fn().mockImplementation((data) => ({
            ...data,
            _id: 'user123',
            save: mockSave.mockResolvedValue({
                ...data,
                _id: 'user123',
                toObject: mockToObject.mockReturnValue({
                    _id: 'user123',
                    email: data.email,
                    name: data.name,
                    role: 'staff',
                }),
            }),
            toObject: mockToObject.mockReturnValue({
                _id: 'user123',
                email: data.email,
                name: data.name,
                role: 'staff',
            }),
        }));
        mockUserModel.findOne = jest.fn();
        mockUserModel.findById = jest.fn();
        mockUserModel.find = jest.fn();
        mockUserModel.findByIdAndDelete = jest.fn();
        mockUserModel.findByIdAndUpdate = jest.fn();

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
            const email = 'test@example.com';
            const password = 'password123';
            const name = 'Test User';

            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });
            const mockUser = {
                _id: 'user123',
                email,
                name,
                role: 'staff',
                toObject: jest.fn().mockReturnValue({ _id: 'user123', email, name, role: 'staff' }),
                save: jest.fn().mockResolvedValue(true),
            };
            // Mock the constructor behavior
            mockUserModel.mockImplementation = jest.fn().mockReturnValue(mockUser);

            const result = await service.register(email, password, name);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
            expect(mockUserModel.findOne).toHaveBeenCalled();
        });

        it('should throw ConflictException if user already exists', async () => {
            const email = 'existing@example.com';
            const password = 'password123';
            const name = 'Existing User';

            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ email }),
            });

            await expect(service.register(email, password, name)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const email = 'test@example.com';
            const password = 'password123';

            const mockUser = {
                _id: 'user123',
                email,
                password: await bcrypt.hash(password, 10),
                name: 'Test User',
                role: 'staff',
                isActive: true,
                lastLoginAt: null,
                toObject: jest.fn().mockReturnValue({ _id: 'user123', email, name: 'Test User', role: 'staff' }),
                save: jest.fn().mockResolvedValue(true),
            };

            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockUser),
            });

            const result = await service.login(email, password);

            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
        });

        it('should throw UnauthorizedException with invalid credentials', async () => {
            const email = 'test@example.com';
            const password = 'wrongpassword';

            mockUserModel.findOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
        });
    });
});
