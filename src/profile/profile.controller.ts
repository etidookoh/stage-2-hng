// import { Controller } from '@nestjs/common';
// import { ProfileService } from './profile.service';

// @Controller('profile')
// export class ProfileController {
//   constructor(private readonly profileService: ProfileService) {}
// }


import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UnprocessableEntityException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { QueryProfileDto } from './dto/query-profile.dto';

@Controller('api/profiles')
export class ProfileController {
  constructor(private readonly profilesService: ProfileService) {}

  @Get()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) =>
          Object.values(e.constraints || {}).join(', '),
        );
        // Type errors → 422, missing/empty → 400
        const isTypeError = errors.some((e) =>
          Object.keys(e.constraints || {}).some((k) =>
            ['isNumber', 'isInt', 'isBoolean'].includes(k),
          ),
        );
        if (isTypeError) {
          return new UnprocessableEntityException({
            status: 'error',
            message: 'Invalid query parameters',
          });
        }
        return new BadRequestException({
          status: 'error',
          message: messages[0] || 'Invalid query parameters',
        });
      },
    }),
  )
  async findAll(@Query() query: QueryProfileDto) {
    return this.profilesService.findAll(query);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    if (!q || !q.trim()) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to interpret query',
      });
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new UnprocessableEntityException({
        status: 'error',
        message: 'Invalid query parameters',
      });
    }

    return this.profilesService.search(q, pageNum, Math.min(limitNum, 50));
  }
}