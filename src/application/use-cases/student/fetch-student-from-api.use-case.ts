// src/application/use-cases/student/fetch-student-from-api.use-case.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IStudentRepository } from '../../../domain/repositories/student.repository';
import type { IUserRepository } from 'src/domain/repositories/user.repository';
import type { IUnitOfWork } from '../../../domain/repositories/unit-of-work.repository';
import { HttpClientService } from 'src/infrastructure/services/http-client.service';
import { PasswordService } from 'src/infrastructure/services/password.service';
import type { IRoleRepository } from 'src/domain/repositories/role.repository';
import { ROLE_IDS } from 'src/shared/constants/roles.constant';
import type { ApiUserData, ApiResponse, ApiRequestOptions } from '../../../domain/interface/api';


@Injectable()
export class FetchStudentFromApiUseCase {
    private readonly logger = new Logger(FetchStudentFromApiUseCase.name);

    constructor(
        @Inject('IStudentRepository') private readonly studentRepository: IStudentRepository,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
        @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
        @Inject('HTTP_CLIENT_SERVICE') private readonly httpClient: HttpClientService,
        @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
        @Inject('IRoleRepository') private readonly roleRepository: IRoleRepository,
    ) { }

    async execute(limit?: number): Promise<{ processed: number; errors: number }> {
        this.logger.log('Starting fetch students from API process...');

        // 1. Tạo URL với limit parameter
        const baseUrl = 'http://localhost:3000/api/v1/admin/user';
        const url = limit ? `${baseUrl}?limit=${limit}` : baseUrl;

        let processedCount = 0;
        let errorCount = 0;

        try {
            // 2. Lấy danh sách học sinh từ API
            const apiOptions: ApiRequestOptions = {
                timeout: 30000,
                maxRetries: 3,
                retryDelay: 2000
            };

            const response = await this.httpClient.requestWithRetry('GET', url, undefined, apiOptions);

            if (!response.success || !response.data) {
                throw new Error('Failed to fetch data from API');
            }

            // Xử lý response data (có thể là array hoặc object có property data)
            let studentsData: any = response.data;
            if (studentsData.data) {
                studentsData = studentsData.data;
            }
            const students: ApiUserData[] = Array.isArray(studentsData) ? studentsData : [studentsData];
            this.logger.log(`Fetched ${students.length} students from API`);

            // 3. Xử lý từng học sinh
            for (const studentData of students) {
                try {
                    await this.processStudent(studentData);
                    processedCount++;

                    // Log progress mỗi 50 records
                    if (processedCount % 50 === 0) {
                        this.logger.log(`Processed ${processedCount}/${students.length} students`);
                    }
                } catch (error) {
                    errorCount++;
                    this.logger.error(`Error processing student ID ${studentData.id}: ${error.message}`);
                }
            }

            this.logger.log(`Process completed. Processed: ${processedCount}, Errors: ${errorCount}`);
            return { processed: processedCount, errors: errorCount };

        } catch (error) {
            this.logger.error('Failed to fetch students from API:', error);
            throw error;
        }
    }

    private async processStudent(apiData: ApiUserData): Promise<void> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            // 1. Kiểm tra user đã tồn tại chưa (ưu tiên tìm theo oldUserId trước)
            let user = await this.userRepository.findByOldUserId(apiData.id);
            if (!user) {
                user = await this.userRepository.findByUsername(apiData.username);
            }
            let isNewUser = false;

            if (!user) {
                // 2. Tạo User mới
                const hashedPassword = await this.passwordService.hashPassword(apiData.password);

                user = await this.userRepository.create({
                    username: apiData.username,
                    email: undefined, // API không có email
                    passwordHash: hashedPassword,
                    firstName: apiData.firstName,
                    lastName: apiData.lastName,
                    oldUserId: apiData.id, // Lưu ID từ API vào oldUserId
                    isActive: apiData.isActive,
                });

                isNewUser = true;
                this.logger.debug(`Created user: ${user.username} (ID: ${user.userId}, Old ID: ${apiData.id})`);
            } else {
                // Cập nhật user nếu cần
                await this.userRepository.update(user.userId, {
                    firstName: apiData.firstName,
                    lastName: apiData.lastName,
                    isActive: apiData.isActive,
                });

                this.logger.debug(`Updated user: ${user.username} (ID: ${user.userId})`);
            }

            // 3. Kiểm tra Student đã tồn tại chưa
            let student = await this.studentRepository.findByUserId(user.userId);

            if (!student) {
                // 4. Tạo Student mới
                await this.studentRepository.create({
                    userId: user.userId,
                    studentPhone: apiData.password, // password chính là số điện thoại học sinh
                    parentPhone: apiData.phone, // phone là số điện thoại phụ huynh
                    grade: parseInt(apiData.class), // class -> grade
                    school: apiData.highSchool, // highSchool -> school
                });

                this.logger.debug(`Created student for user ID: ${user.userId}`);
            } else {
                // 5. Cập nhật Student
                await this.studentRepository.update(student.studentId, {
                    studentPhone: apiData.password,
                    parentPhone: apiData.phone,
                    grade: parseInt(apiData.class),
                    school: apiData.highSchool,
                });

                this.logger.debug(`Updated student for user ID: ${user.userId}`);
            }

            // 6. Gán role STUDENT cho user mới (nếu chưa có role này)
            if (isNewUser) {
                const existingRoles = await repos.roleRepository.getUserRoles(user.userId);
                const hasStudentRole = existingRoles.some(userRole => userRole.roleId === ROLE_IDS.STUDENT);

                if (!hasStudentRole) {
                    // Sử dụng method chính thức để gán role
                    await repos.roleRepository.assignRoleToUser(user.userId, ROLE_IDS.STUDENT);
                    this.logger.debug(`Assigned STUDENT role to user ID: ${user.userId}`);
                }
            }
        });
    }
}