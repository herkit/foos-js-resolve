import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SeasonService } from './season.service';

const room = (seasonId: string): string => `season:${seasonId}`;

/**
 * Live `SeasonRanks` view-model over WebSockets.
 *
 * Replaces reSolve's reactive view-model transport. A client emits
 * `subscribeSeason` with a season id, receives the current ranks immediately,
 * and then receives a `ranks` push whenever a match is registered for that
 * season.
 */
@WebSocketGateway({ cors: true })
export class SeasonGateway implements OnModuleInit {
  private readonly logger = new Logger(SeasonGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly seasons: SeasonService) {}

  onModuleInit(): void {
    this.seasons.updates.subscribe(({ seasonId, ranks }) => {
      this.server.to(room(seasonId)).emit('ranks', ranks);
    });
  }

  @SubscribeMessage('subscribeSeason')
  async subscribe(
    @MessageBody() seasonId: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await client.join(room(seasonId));
    const ranks = await this.seasons.getRanks(seasonId);
    client.emit('ranks', ranks);
    this.logger.debug(`client ${client.id} subscribed to ${room(seasonId)}`);
  }
}
