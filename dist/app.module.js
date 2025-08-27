"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const presentation_module_1 = require("./presentation/presentation.module");
const application_module_1 = require("./application/application.module");
const infrastructure_module_1 = require("./infrastructure/infrastructure.module");
const prisma_module_1 = require("./prisma/prisma.module");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwt_config_1 = __importDefault(require("./config/jwt.config"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            infrastructure_module_1.InfrastructureModule,
            application_module_1.ApplicationModule,
            presentation_module_1.PresentationModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [jwt_config_1.default],
            }),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    secret: config.get('jwt.accessSecret'),
                    signOptions: {
                        expiresIn: config.get('jwt.accessExpiresIn'),
                        issuer: config.get('jwt.issuer'),
                        audience: config.get('jwt.audienceApi'),
                    },
                }),
            }),
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map