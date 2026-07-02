import { Body, Controller, Param, Post } from '@nestjs/common';
import { MatchService } from './match.service';

interface SingleMatchBody {
  winner: string;
  loser: string;
  season: string;
}

interface DoubleMatchBody {
  winner1: string;
  winner2: string;
  loser1: string;
  loser2: string;
  season: string;
}

@Controller('matches')
export class MatchController {
  constructor(private readonly matches: MatchService) {}

  @Post(':id/single')
  single(@Param('id') id: string, @Body() body: SingleMatchBody) {
    return this.matches.registerSingleMatch(id, body);
  }

  @Post(':id/double')
  double(@Param('id') id: string, @Body() body: DoubleMatchBody) {
    return this.matches.registerDoubleMatch(id, body);
  }
}
