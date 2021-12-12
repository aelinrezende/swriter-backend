import { diskStorage } from 'multer';
import { DeleteResult, getManager } from 'typeorm';

import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Crud, CrudController } from '@nestjsx/crud';

import { Hint } from './entities/hint.entity';
import { HintsService } from './hints.service';

@Crud({
  model: {
    type: Hint,
  },
  routes: {
    createOneBase: {},
    createManyBase: {},
    getOneBase: {},
    getManyBase: {},
    updateOneBase: {},
    deleteOneBase: {},
  },
  query: {
    alwaysPaginate: true,
    maxLimit: 50,
    join: {
      categories: { eager: true },
    },
  },
  params: {
    id: {
      field: 'id',
      type: 'string',
      primary: true,
    },
  },
  validation: { exceptionFactory: errors => new BadRequestException(errors) },
})
@Controller('hint')
export class HintsController implements CrudController<Hint> {
  constructor(public service: HintsService) {}

  @Get('random')
  async getRandomHint(): Promise<Hint> {
    const hint = await this.service.getRandom(getManager());

    return this.service.repo.save({
      ...hint,
      timesDrawn: hint.timesDrawn + 1,
    });
  }

  @Post('importCsv')
  @UseInterceptors(
    FileInterceptor('file', { storage: diskStorage({ destination: './tmp' }) }),
  )
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    await this.service.parseCsv(file);
  }

  @Delete()
  async deleteAll(): Promise<DeleteResult> {
    return await this.service.repo
      .createQueryBuilder('hint')
      .delete()
      .where('id IS NOT NULL')
      .execute();
  }
}
