import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { LeaguesQueryService } from './leagues.query.service';

/** Read (query) endpoints for leagues. */
@Controller('leagues')
export class LeaguesReadController {
  constructor(private readonly leagues: LeaguesQueryService) {}

  @Get()
  all() {
    return this.leagues.all();
  }

  @Get('by-slug')
  async bySlug(@Query('slug') slug: string) {
    const league = await this.leagues.getBySlug(slug);
    if (!league) throw new NotFoundException('League not found');
    return league;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const league = await this.leagues.getById(id);
    if (!league) throw new NotFoundException('League not found');
    return league;
  }
}
