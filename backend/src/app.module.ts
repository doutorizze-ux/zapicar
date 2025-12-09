import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FaqModule } from './faq/faq.module';
import { LeadsModule } from './leads/leads.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { PublicSiteController } from './stores/public-site.controller';
import { User } from './users/entities/user.entity';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { Plan } from './plans/entities/plan.entity';
import { Lead } from './leads/entities/lead.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'zapcar_db',
      entities: [User, Vehicle, Plan, Lead],
      synchronize: true, // Auto-create tables (dev only)
    }),
    AuthModule,
    UsersModule,
    VehiclesModule,
    WhatsappModule,
    PlansModule,
    SubscriptionsModule,
    FaqModule,
    LeadsModule
  ],
  controllers: [AppController, DashboardController, PublicSiteController],
  providers: [AppService],
})
export class AppModule { }
